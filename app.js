const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const ObjectId = require("mongodb").ObjectId;

const app = express();
const ejs = require("ejs");

app.set("view engine", "ejs");
const port = process.env.PORT || 3000;

mongoose
  .connect("mongodb://127.0.0.1:27017/pro")
  .then(() => {
    console.log("Connected to MongoDB (pro)");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB (pro): ", err);
  });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
  session({
    secret: "1234",
    resave: false,
    saveUninitialized: false,
  })
);

app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

const noteSchema = new mongoose.Schema({
  text: String,
  fileName: String,
  filePath: String,
});
const Note = mongoose.model("Note", noteSchema);

// Configure multer for file uploads
const upload = multer({ dest: "uploads/" });

// Route for adding a note
app.post("/api/notes", upload.single("noteFile"), (req, res) => {
  const noteText = req.body.noteText;
  const file = req.file;

  const newNote = {
    text: noteText,
    fileName: file ? file.originalname : null,
    filePath: file ? file.path : null,
  };

  Note.create(newNote)
    .then((result) => {
      res.redirect("/");
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error creating note");
    });
});

// Route for retrieving all notes
app.get("/api/notes", (req, res) => {
  Note.find({})
    .exec()
    .then((result) => {
      res.json(result);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error retrieving notes");
    });
});

// Route for serving PDF files
app.get("/pdf/:id", async (req, res) => {
  const noteId = req.params.id;

  try {
    const note = await Note.findById(noteId);

    if (!note || !note.filePath) {
      res.status(404).send("PDF not found");
      return;
    }

    const filePath = path.join(__dirname, note.filePath);
    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error reading PDF file");
        return;
      }
      res.contentType("application/pdf");
      res.send(data);
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error finding note");
  }
});

// Route for searching notes by substring in noteText
app.get("/api/notes/search/:substring", async (req, res) => {
  const substring = req.params.substring;

  try {
    const notes = await Note.find({
      text: { $regex: substring, $options: "i" },
    }).exec();
    if (!notes || notes.length === 0) {
      res.status(404).send("No notes found");
      return;
    }
    res.json(notes);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error searching notes");
  }
});

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  email: { type: String, unique: true },
  password: String,
});

const User = mongoose.model("User", userSchema);

const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  quadrant: String,
  taskName: String,
});

const Task = mongoose.model("Task", taskSchema);

const todoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  taskName: String,
});

const Todo = mongoose.model("Todo", todoSchema);

const notesSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title: String,
    content: String,
  },
  { collection: "notes-taking-notes" }
); // Set collection name to 'notes-taking-notes'

const Notes = mongoose.model("NoteT", notesSchema);

function isValidUsername(username) {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

app.get("/", (req, res) => {
  res.render("welcome");
});
app.get("/home", async (req, res) => {
  try {
    // Fetch recent notes from the database
    const notess = await Note.find({}).limit(3);
    console.log(notess); // Assuming you want to limit to 3 recent notes
    // Render the home page and pass the user and notes data to the template
    res.render("home", { user: req.session.user, notes: notess });
  } catch (err) {
    console.error("Error fetching recent notes: ", err);
    res.status(500).json({ error: "Error fetching recent notes" });
  }
});

app.get("/spinning_wheel", (req, res) => {
  res.render("spinning_wheel");
});
app.get("/eisenhower_matrix", async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    // If user is not logged in, redirect to login page
    return res.redirect("/login");
  }

  try {
    // Fetch tasks for the logged-in user for each quadrant
    const userId = req.session.user._id;
    const tasksImportantUrgent = await Task.find({
      userId,
      quadrant: "important-urgent",
    });
    const tasksImportantNotUrgent = await Task.find({
      userId,
      quadrant: "important-not-urgent",
    });
    const tasksNotImportantUrgent = await Task.find({
      userId,
      quadrant: "not-important-urgent",
    });
    const tasksNotImportantNotUrgent = await Task.find({
      userId,
      quadrant: "not-important-not-urgent",
    });

    // Render the Eisenhower Matrix view and pass tasks for each quadrant
    res.render("eisenhower_matrix", {
      user: req.session.user,
      tasksImportantUrgent,
      tasksImportantNotUrgent,
      tasksNotImportantUrgent,
      tasksNotImportantNotUrgent,
    });
  } catch (err) {
    console.error("Error fetching tasks: ", err);
    res.status(500).json({ error: "Error fetching tasks" });
  }
});
app.get("/login", function (req, res) {
  res.render("login");
});
app.get("/yt_summary", function (req, res) {
  res.render("yt_summary");
});
app.get("/note_sharing", function (req, res) {
  res.render("note_sharing");
});
app.get("/signup", function (req, res) {
  res.render("signup");
});
app.get("/spinning_wheel", function (req, res) {
  res.render("spinning_wheel");
});
app.get("/priority_setter", function (req, res) {
  res.render("priority_setter");
});
app.get("/quiz", function (req, res) {
  res.render("quiz");
});

app.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;
  if (!isValidUsername(username)) {
    return res.status(400).json({ error: "Invalid username" });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Invalid email" });
  }
  try {
    const user = await User.create({ username, email, password });
    req.session.user = user; // Set user in session
    res.redirect("/home"); // Redirect to home page
  } catch (err) {
    console.error("Error creating user: ", err);
    res.status(500).json({ error: "Error creating user" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email, password });
    if (user) {
      req.session.user = user;

      res.redirect("/home");
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (err) {
    console.error("Error logging in: ", err);
    res.status(500).json({ error: "Error logging in" });
  }
});

app.post("/addTask", async (req, res) => {
  console.log("Received data:", req.body);
  const { userId, quadrant, taskName } = req.body;
  try {
    const task = await Task.create({ userId, quadrant, taskName });
    res.status(201).json({ message: "Task created successfully", task });
  } catch (err) {
    console.error("Error creating task: ", err);
    res.status(500).json({ error: "Error creating task" });
  }
});

app.get("/loadTasks/:userId/:quadrantId", async (req, res) => {
  try {
    const { userId, quadrantId } = req.params;
    const tasks = await Task.find({ userId, quadrant: quadrantId });

    // Check if tasks were found
    if (!tasks) {
      return res
        .status(404)
        .json({
          error: `No tasks found for user ${userId} in quadrant ${quadrantId}`,
        });
    }

    res.status(200).json({ tasks });
  } catch (err) {
    console.error(`Error loading tasks for ${quadrantId}:`, err);
    res.status(500).json({ error: `Error loading tasks for ${quadrantId}` });
  }
});

app.delete("/deleteTask/:taskId", async (req, res) => {
  const { taskId } = req.params;
  try {
    await Task.findByIdAndDelete(taskId);
    res.sendStatus(200);
  } catch (error) {
    console.error("Error deleting task:", error);
    res.sendStatus(500);
  }
});

app.post("/addTasktodo", async (req, res) => {
  const { taskName } = req.body;
  const userId = req.session.user._id; // Assuming user is logged in and session is set
  try {
    const task = await Todo.create({ userId, taskName });
    res.redirect("/home_page"); // Redirect back to home page after adding task
  } catch (err) {
    console.error("Error creating task: ", err);
    res.status(500).json({ error: "Error creating task" });
  }
});

app.get("/home_page", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/login"); // Redirect to login if user is not logged in
    }
    const userId = req.session.user._id;
    const tasks = await Todo.find({ userId });
    res.render("home_page", { tasks });
  } catch (err) {
    console.error("Error fetching tasks: ", err);
    res.status(500).json({ error: "Error fetching tasks" });
  }
});

app.delete("/deleteTasktodo/:taskId", async (req, res) => {
  const { taskId } = req.params;
  try {
    await Todo.findByIdAndDelete(taskId); // Corrected to Todo
    res.sendStatus(200);
  } catch (error) {
    console.error("Error deleting task:", error);
    res.sendStatus(500);
  }
});

app.post("/notes", async (req, res) => {
  const { title, content } = req.body;
  const userId = req.session.user._id;
  try {
    const note = await Notes.create({ userId, title, content });
    res.redirect("/notes_take");
  } catch (err) {
    console.error("Error creating note: ", err);
    res.status(500).json({ error: "Error creating note" });
  }
});

app.get('/notes_take', async (req, res) => {
  try {
      if (!req.session.user) {
          return res.redirect('/login');
      }
      const userId = req.session.user._id;
      let query = {};
      if (req.query.search) {
          query = { userId, title: { $regex: req.query.search, $options: 'i' } };
      } else {
          query = { userId };
      }
      const notes = await Notes.find(query);
      res.render("notes_take", { notes });
  } catch (err) {
      console.error('Error fetching notes: ', err);
      res.status(500).json({ error: 'Error fetching notes' });
  }
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
