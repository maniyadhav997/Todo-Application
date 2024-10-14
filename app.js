const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const format = require('date-fns/format')
const isMatch = require('date-fns/isMatch')

const isValid = require('date-fns/isValid')

const dbpath = path.join(__dirname, 'todoApplication.db')

const app = express()

app.use(express.json())

let db = null

const intializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is running on http://localhost:3000')
    })
  } catch (e) {
    console.log(`Error Message e.message`)
    process.exit(1)
  }
}

intializeDBAndServer()

const hasPriorityAndStatus = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriority = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatus = requestQuery => {
  return requestQuery.status !== undefined
}

const haCatagoryAndStatus = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  )
}

const hasCatagoryAndPriority = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  )
}

const hasSearch = requestQuery => {
  return requestQuery.search_q !== undefined
}

const hasCatagory = requestQuery => {
  return requestQuery.category !== undefined
}

const outPutResult = dbObject => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    category: dbObject.category,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  }
}

app.get('/todos/', async (request, response) => {
  let data = null
  let getTodosQuery = ''

  const {search_q = '', priority, status, category} = request.query

  switch (true) {
    case hasPriorityAndStatus(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodosQuery = `
                    SELECT * FROM todo WHERE status='${status}' AND priority='${priority}'
                `
          data = await db.all(getTodosQuery)
          response.send(data.map(eachItem => outPutResult(eachItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case haCatagoryAndStatus(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodosQuery = `
                    SELECT * FROM todo where category ='${category}' AND status='${status}';
                `
          data = await db.all(getTodosQuery)
          response.send(data.map(eachItem => outPutResult(eachItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case hasCatagoryAndPriority(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          priority === 'HIGH' ||
          priority === 'MEDIUM' ||
          priority === 'LOW'
        ) {
          getTodosQuery = `
                    SELECT * FROM todo WHERE category='${category}' AND priority='${priority}';
                `
          data = await db.all(getTodosQuery)
          response.send(data.map(eachItem => outPutResult(eachItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Priority')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    case hasPriority(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        getTodosQuery = `
                SELECT * FROM todo WHERE priority='${priority}';
            `
        data = await db.all(getTodosQuery)
        response.send(data.map(eachItem => outPutResult(eachItem)))
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    case hasStatus(request.query):
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        getTodosQuery = `
                SELECT * FROM todo WHERE status='${status}';
            `
        data = await db.all(getTodosQuery)
        response.send(data.map(eachItem => outPutResult(eachItem)))
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break

    case hasSearch(request.query):
      getTodosQuery = `
                SELECT * FROM todo WHERE todo LIKE "%${search_q}%";
            `
      data = await db.all(getTodosQuery)
      response.send(data.map(eachItem => outPutResult(eachItem)))

      break

    case hasCatagory(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        getTodosQuery = `
                SELECT * FROM todo WHERE category='${category}';
        `
        data = await db.all(getTodosQuery)
        response.send(data.map(eachItem => outPutResult(eachItem)))
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }

      break

    default:
      getTodosQuery = `
                SELECT * FROM todo;
        `
      data = await db.all(getTodosQuery)
      response.send(data.map(eachItem => outPutResult(eachItem)))
  }
})

//API 2   Path: /todos/:todoId/       Method: GET

app.get('/todos/:todoId', async (request, response) => {
  const {todoId} = request.params
  const getTodosQuery = `
        SELECT * FROM todo WHERE id=${todoId};
    `
  const responseResult = await db.get(getTodosQuery)
  response.send(outPutResult(responseResult))
})

//API 3      Path: /agenda/      Method: GET

app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  console.log(isMatch(date, 'yyyy-MM-dd'))
  if (isMatch(date, 'yyyy-MM-dd')) {
    const newDate = format(new Date(date), 'yyyy-MM-dd')
    console.log(newDate)
    const requestQuery = `
            SELECT * FROM todo WHERE due_date='${newDate}';
        `
    const responseResult = await db.all(requestQuery)
    response.send(responseResult.map(eachItem => outPutResult(eachItem)))
  } else {
    response.status(400)
    response.send('Invalid Due Date')
  }
})

//API 4               Path: /todos/          Method: POST

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body
  if (priority === 'HIGH' || priority === 'LOW' || priority === 'MEDIUM') {
    if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (isMatch(dueDate, 'yyyy-MM-dd')) {
          const postNewDueDate = format(new Date(dueDate), 'yyyy-MM-dd')
          const postTodayQuery = `
                        INSERT INTO todo (id, todo, category, priority, status, due_date)
       VALUES (${id}, '${todo}', '${category}', '${priority}', '${status}', '${postNewDueDate}');
   `
          await db.run(postTodayQuery)
          response.send('Todo Successfully Added')
        } else {
          response.status(400)
          response.send('Invalid Due Date')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
    }
  } else {
    response.status(400)
    response.send('Invalid Todo Priority')
  }
})

//API 5           Path: /todos/:todoId/      Method: PUT

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  let updateColumn = ''
  const requestBody = request.body
  const statusValues = ['TO DO', 'IN PROGRESS', 'DONE']
  const validCategories = ['WORK', 'HOME', 'LEARNING']

  /* console.log(requestBody)

  
  
  */
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = 'Status'
      break
    case requestBody.priority !== undefined:
      updateColumn = 'Priority'
      break
    case requestBody.todo !== undefined:
      updateColumn = 'Todo'
      break
    case requestBody.category !== undefined:
      updateColumn = 'Category'
      break
    case requestBody.dueDate !== undefined:
      updateColumn = 'Due Date'
      break
  }
  const previousTodoQuery = `
        SELECT * FROM todo WHERE id=${todoId};
    `
  const previousTodo = await db.get(previousTodoQuery)

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body
  let updateTodoQuery

  switch (updateColumn) {
    case 'Status':
      if (statusValues.includes(status)) {
        updateTodoQuery = `
                    UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
                    due_date='${dueDate}' WHERE id=${todoId};
                `
        await db.run(updateTodoQuery)
        response.send('Status Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    //update priority
    case 'Priority':
      if (['HIGH', 'MEDIUM', 'LOW'].includes(priority)) {
        updateTodoQuery = `
                UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
                due_date='${dueDate}' WHERE id=${todoId};
            `
        await db.run(updateTodoQuery)
        response.send('Priority Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    case 'Todo':
      updateTodoQuery = `
                UPDATE todo SET todo='${todo}' , priority='${priority}', status='${status}', category='${category}',
                due_date='${dueDate}' WHERE id=${todoId};
            `
      await db.run(updateTodoQuery)
      response.send('Todo Updated')
      break
    // update category

    case 'Category':
      if (validCategories.includes(category)) {
        updateTodoQuery = `
                UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
                due_date='${dueDate}' WHERE id=${todoId};
            `
        await db.run(updateTodoQuery)
        response.send('Category Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    //update due date

    case 'Due Date':
      if (isMatch(dueDate, 'yyyy-MM-dd')) {
        const newDueDate = format(new Date(dueDate), 'yyyy-MM-dd')

        updateTodoQuery = `
                UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
                due_date='${newDueDate}' WHERE id=${todoId};
            `
        await db.run(updateTodoQuery)
        response.send('Due Date Updated')
      } else {
        response.status(400)
        response.send('Invalid Due Date')
      }
      break
  }
})

//API 6             Path: /todos/:todoId/         Method: DELETE

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params

  const deleteTodoQuery = `
        DELETE FROM todo 
            WHERE id=${todoId};
    `
  await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
