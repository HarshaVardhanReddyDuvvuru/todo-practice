const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

app.get("/todos/", async (request, response) => {
  const { status = "", priority = "", search_q = "" } = request.query;
  status.replace(" ", "%20");
  let selectTodosQuery;
  if (status !== "" && priority !== "") {
    selectTodosQuery = `
        SELECT
             *
        FROM
            todo
        WHERE
        todo LIKE '%${search_q}%'
        AND
        status = '${status}'
        AND
            priority = '${priority}'
      `;
  } else if (status !== "") {
    selectTodosQuery = `
        SELECT
             *
        FROM
            todo
        WHERE todo LIKE '%${search_q}%' AND status = '${status}'
      `;
  } else if (priority !== "") {
    selectTodosQuery = `
        SELECT
             *
        FROM
            todo
        WHERE todo LIKE '%${search_q}%' AND priority = '${priority}'
      `;
  } else {
    selectTodosQuery = `
        SELECT
             *
        FROM
            todo
        WHERE todo LIKE '%${search_q}%'
      `;
  }
  const todoItems = await database.all(selectTodosQuery);
  response.send(todoItems);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
        SELECT
            *
        FROM
            todo
        WHERE 
            id=${todoId};
    `;
  const todo = await database.get(getTodoQuery);
  response.send(todo);
});

app.post("/todos/", async (request, response) => {
  const todoItem = request.body;
  const { id, todo, priority, status } = todoItem;
  const createTodoQuery = `
        INSERT INTO todo VALUES(
            ${id},
            '${todo}',
            '${priority}',
            '${status}'
        );
    `;
  await database.run(createTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoItem = request.body;
  const { todo, priority, status } = todoItem;
  let updateTodoQuery;
  let responseItem;
  if (status !== undefined) {
    updateTodoQuery = `
        UPDATE
            todo
        SET 
            status = '${status}'
        WHERE  id=${todoId};
    `;
    responseItem = "Status";
  } else if (priority !== undefined) {
    updateTodoQuery = `
        UPDATE
            todo
        SET 
            priority = '${priority}'
        WHERE  id=${todoId};
    `;
    responseItem = "Priority";
  } else if (todo !== undefined) {
    updateTodoQuery = `
        UPDATE
            todo
        SET 
            todo = '${todo}'
        WHERE id=${todoId};
    `;
    responseItem = "Todo";
  }
  await database.get(updateTodoQuery);
  response.send(responseItem + " Updated");
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
        DELETE FROM
        todo
        WHERE
            id = ${todoId};
    `;
  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
