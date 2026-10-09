// 1. Import the express module
const express = require('express');

// 2. Initialize the Express application
const app = express();

app.use(express.json()); //middleware to parse JSON request bodies

// 3. Define a basic route
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: "attendly API is running",
        data: null
    });
});

module.exports = app;

// 4. Start the server on port 3000
const PORT = 3000;

let students = [
        { id: 1, 
            name: "Ore", 
            age: 19, 
            department: "computerScience"
        },

        { id: 2, 
            name: "Taiwo", 
            age: 19, 
            department: "massCom"
        },
    ];

app.get('/students', (req, res) => {
    res.json(students);
});

app.post('/students', (req, res) => {
    const newStudent = req.body;

    students.push(newStudent);

    res.json(newStudent);
});

app.get('/students/:id', (req, res) => {
    const id = Number(req.params.id);

    const student = students.find(student => student.id === id);

    if(!student){
        return res.status(404).json({
            message: "student not found"
        });
    }

    res.json(student);     
});

app.put('/students/:id', (req, res) => {
    const id = Number(req.params.id);

    const student = students.find(student => student.id === id);

    if(!student){
        return res.status(404).json({
            message: "student not found"
        });
    }

    student.name = req.body.name;
    student.age = req.body.age;
    student.department = req.body.deparment;

    res.json(student);     
});

app.delete('/students/:id', (req, res) => {
    const id = Number(req.params.id);

    const student = students.find(student => student.id === id);

    if(!student){
        return res.status(404).json({
            message: "student not found"
        });
    }

    students = students.filter(student => student.id !==id);

    res.json({
        message: "student deleted succesfully"});     
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});