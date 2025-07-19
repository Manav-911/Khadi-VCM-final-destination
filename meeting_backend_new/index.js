const express = require('express')
const app = express()
const cors = require('cors');
const meetingHandle = require('./routes/meeting.routes.js')

app.use(cors());
app.use(express.json());

let meetings = [];

// app.get('/api/meetings', (req, res) => {
//   res.json(meetings.filter(m => m && m.id));
// });

// app.post('/api/meetings', (req, res)=>{
//     const newMeeting = req.body;
//     meetings.push(newMeeting);
//     res.status(201).json({message:'Successfully meeting added',newMeeting});
//     console.log("Received meeting:", req.body);
// });

// app.post('/approve', (req, res)=>{
//     const {id} = req.body;
//     meetings = meetings.map(m=>m.id == id ? {...m, status:'Approved', approvedAt: new Date()}:m);
//     res.json({message:'Meeting approved'});
// });

// app.post('/decline', (req, res) => {
//     const { id } = req.body;
//     meetings = meetings.map(m => m.id === id ? { ...m, status: 'DECLINED', declinedAt: new Date() } : m);
//     res.json({ message: 'Meeting declined' });
// });

app.use('/api/meetings', meetingHandle);

app.listen(5000, ()=>{
    console.log('Server started');
});