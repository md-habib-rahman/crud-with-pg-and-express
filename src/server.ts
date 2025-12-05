import express, { NextFunction } from 'express'
import { Pool } from 'pg'
import dotenv from 'dotenv'
import path from "path"

dotenv.config({ path: path.join(process.cwd(), ".env") })
const app = express()
const port = 3000


//parser
app.use(express.json())
//DB
const pool = new Pool({
	connectionString: `${process.env.CONNECTION_STR}`
})

const initDB = async () => {
	await pool.query(`
		CREATE TABLE IF NOT EXISTS users(
		id SERIAL PRIMARY KEY,
		name VARCHAR(100) NOT NULL,
		email VARCHAR(150) UNIQUE NOT NULL,
		age INT,
		phone VARCHAR(15),
		address TEXT,
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW()
		)
		`)

	await pool.query(`
			
			CREATE TABLE IF NOT EXISTS todos(
			id SERIAL PRIMARY KEY,
			user_id INT REFERENCES users(id) ON DELETE CASCADE,
			title VARCHAR(200) NOT NULL,
			description TEXT,
			completed BOOLEAN DEFAULT false,
			due_date DATE,
			created_at TIMESTAMP DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NOW()
			)`)
}

initDB()

//logger middlewear
const logger = (req: Request, res: Response, next: NextFunction) => {
	console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}\n`);
	next();
}


app.get("/", logger, (req: Request, res: Response) => {
	res.send("Hello Next level developers")
})

//all users api
app.get('/users', async (req: Request, res: Response) => {
	try {
		const result = await pool.query(`SELECT * FROM users`);
		res.status(200).send({
			success: true,
			message: "users retrived successfully",
			data: result.rows
		})

	} catch (err: any) {
		res.status(500).json({
			success: false,
			message: err.message,
			details: err
		})
	}
})

//insert users api

app.post('/users', async (req: Request, res: Response) => {
	const { name, email } = req.body
	try {
		const result = await pool.query(`INSERT INTO users(name,email) VALUES($1,$2) RETURNING *`, [name, email])
		res.status(201).json({
			success: true,
			message: "data inserted",
			data: result.rows[0]
		})


	} catch (err: any) {
		res.status(500).json({
			success: false,
			message: err.message
		})

	}
	// console.log(req.body)
	// res.status(201).json({
	// 	success: true,
	// 	message: "API is working"
	// })
})

//get specific user api
app.get('/users/:id', async (req: Request, res: Response) => {
	// console.log(req.params.id)
	try {
		const result = await pool.query(`SELECT * FROM users WHERE id=$1`, [req.params.id])
		if (result.rows.length === 0) {
			res.status(404).send({
				success: false,
				message: 'no user found'
			})
		} else {
			res.status(200).send({
				success: true,
				message: "user found",
				data: result.rows[0]
			})
		}

	} catch (err: any) {
		res.status(500).json({
			success: false,
			message: err.message
		})
	}
})

//delete user api
app.delete('/users/:id', async (req: Request, res: Response) => {
	// console.log(req.params.id)
	try {
		const result = await pool.query(`DELETE FROM users WHERE id=$1 RETURNING *`, [req.params.id])
		if (result.rows.length === 0) {
			res.status(404).send({
				success: false,
				message: 'no user found'
			})
		} else {
			res.status(200).send({
				success: true,
				message: "user DELETED",
				data: null
			})
		}

	} catch (err: any) {
		res.status(500).json({
			success: false,
			message: err.message
		})
	}
})

//update user api
app.put('/users/:id', async (req: Request, res: Response) => {
	const { name, email } = req.body
	// console.log(req.params.id)
	try {
		const result = await pool.query(`UPDATE users SET name=$1, email=$2 WHERE id=$3 RETURNING *`, [name, email, req.params.id])
		if (result.rows.length === 0) {
			res.status(404).send({
				success: false,
				message: 'no user found'
			})
		} else {
			res.status(200).send({
				success: true,
				message: "user info updated",
				data: result.rows[0]
			})
		}

	} catch (err: any) {
		res.status(500).json({
			success: false,
			message: err.message
		})
	}
})

//todos create api
app.post('/todos', async (req: Request, res: Response) => {
	const { user_id, title } = req.body
	try {
		const result = await pool.query(`INSERT INTO todos (user_id,title) VALUES($1,$2) RETURNING *`, [user_id, title])
		res.status(201).send({
			success: true,
			message: "todo created",
			data: result.rows[0]
		})
	} catch (err: any) {
		res.status(500).send({
			success: false,
			message: err.message
		})
	}

})

//todos update api
app.put('/todos/:id', logger, async (req: Request, res: Response) => {
	const { id } = req.params
	const { title, description } = req.body
	try {
		const result = await pool.query(`UPDATE todos SET title=$1 ,description=$2 where id=$3 RETURNING *`, [title, description, id])
		// console.log(result)

	} catch (err: any) {
		res.status(500).send({
			success: false,
			message: err.message
		})
	}
})

//get todos api
app.get('/todos', logger, async (req: Request, res: Response) => {
	try {
		const result: any = await pool.query('SELECT * FROM todos')
		// console.log(result)
		if (result.rowCount > 0) {
			res.status(200).send({
				success: true,
				message: "todos fetched successfully",
				data: result.rows
			})
		} else {
			res.status(404).send({
				success: false,
				message: "todos not found",

			})
		}

	} catch (err: any) {
		res.status(500).send({
			success: false,
			message: err.message

		})
	}
})

//get single todo api
app.get('/todos/:id', logger, async (req: Request, res: Response) => {
	const { id } = req.params
	try {
		const result: any = await pool.query(`SELECT * FROM todos WHERE id=$1`, [id])
		if (result.rowCount > 0) {
			res.status(200).send({
				success: false,
				message: 'todos found',
				data: result.rows
			})
		} else {
			res.status(404).send({
				success: false,
				message: "todo not found",

			})
		}

	} catch (err: any) {
		res.status(500).send({
			success: false,
			message: err.message
		})

	}
})

//remove todo api
app.delete('/todos/:id', logger, async (req: Request, res: Response) => {
	const { id } = req.params
	try {
		const result: any = await pool.query('DELETE FROM todos WHERE id=$1 RETURNING *', [id])
		if (result.rowCount > 0) {
			res.status(200).send({
				success: true,
				message: 'todo deleted successfully',
				data: result.rows
			})
		}else{
			res.status(200).send({
				success: false,
				message: 'todo not found',
				
			})
		}

	} catch (err: any) {
		res.status(500).send({
			success: false,
			message: err.message
		})
	}

})

app.use((req, res) => {
	res.status(404).send({
		success: false,
		message: 'Route not found',
		path: req.path
	})
})

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`)
})