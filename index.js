var express = require("express");
var cookieParser = require("cookie-parser")
var multer = require('multer');
var path = require("path")
var bodyParser = require('body-parser')
var app = express();
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.json());
app.use(cookieParser());
const mongoose = require('mongoose')


var cors = require("cors");
const { response } = require("express");
app.use(cors({ optionsSuccessStatus: 200, origin: 'https://divyanshu-frontend-dobby.divu050704.repl.co', credentials: true }));  
app.use(express.static("public"));

const url = process.env['MONGO_URI']
const connectionParams = {
  useNewUrlParser: true,
  useUnifiedTopology: true
}
mongoose.connect(url, connectionParams)
  .then(() => {
    console.log('Connected to the database ')
  })
  .catch((err) => {
    console.error(`Error connecting to the database. n${err}`);
  })
const dataSchema = new mongoose.Schema({
  username: {
    required: true,
    type: String
  },
  passwd: {
    required: true,
    type: String
  },
  SID: {
    type: String
  }
})
const Model = mongoose.model("users", dataSchema)
const fileSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true
  },
  name:{
    type: String,
    required: true
  },
  user:{
    type: String,
    required: true
  }
})

const fileModel = mongoose.model("files", fileSchema)
const storage = multer.diskStorage({
  destination: (req, file, callBack) => {
    callBack(null, './public')
  },
  filename: (req, file, callBack) => {
    callBack(null, file.originalname)
  }
})

let upload = multer({ storage: storage })


app.post("/signup/", (req, res) => {
  const data = new Model({
    username: req.body.username,
    passwd: req.body.password,

  })
  async function save(){
    const check = await Model.find({username: req.body.username}).exec()
    if (check.length===0){
      try{
        data.save()
        res.status(200).send({Created: true})
      }
      catch(error){
        console.log(error)
      }
    }
    else{
      res.status(200).send({Created: false})    
    }
  }
  save()


})
/*

*/
app.use(cookieParser());
app.post("/login/",(req,res) => {
  const rand = () => {
    return Math.random().toString(36).substr(2);
  };

  const token = () => {
    return rand() + rand();
  };
  const id = token()
  async function Login(){
    const checker = await Model.updateOne({username: req.body.username, passwd: req.body.password}, {$set: {SID: id}}).exec()
    if (checker.modifiedCount === 1){
    
      res.cookie("SID", id)
      res.cookie("uname", req.body.username)
      res.status(200).send({login: true})
      
    }
    else{
      res.status(200).send({login: false})
    }
  }
  Login()

})
app.get("/verify/",(req,res) => {
  async function verify(){
    
    const object = await Model.find({
      username: req.cookies.uname,
      SID: req.cookies.SID
    }).exec()
    if (object.length === 1){
      res.status(200).send({valid: true})
    }
    else{
      res.status(200).send({valid: false})
    }
  }
  verify()
})


app.get("/logout/",(req,res) => {
  res.clearCookie("SID")
  res.clearCookie("uname")
  res.send("logged out")
})

app.post('/upload/', upload.single('file'), (req, res, next) => {
  const file = req.file;
  if (!file) {
    const error = new Error('No File')
    error.httpStatusCode = 400
    res.send({ fileName: "not Created" })
  }
  res.status(200).send({ fileName: file.originalname })
})

app.post("/save/", (req, res) => {
  const data = new fileModel({fileName: req.body.fileName, user: req.cookies.uname,name : req.body.name})
  async function save(data) {
    const query = await fileModel.findOne({fileName: req.body.fileName, name: req.cookies.uname}).exec()
    if (query === null) {
      const saved = await data.save()
      res.send({ Status: true })

    }
    else {

      res.send({ Status: false })
    }
  }

  save(data)

})

app.get("/data",(req,res) => {
  async function data() {
    const object = await fileModel.find({user: req.cookies.uname}).exec()
    
    res.status(200).send(object)
  }
  data()
})
 
var listener = app.listen(8080, function() {
  console.log("Your app is listening on port " + listener.address().port);
});