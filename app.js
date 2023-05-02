// const zonefile =  import('dns-zonefile');
const zonefile =  require('dns-zonefile');
const fs = require("fs");

const express = require("express");
// const express = import("express");
const req = require("express/lib/request");
// const req = import("express/lib/request");
const app = express();//daca folosesc import la app express de ex, nu pot folosi express() as a function
const mongoose = require("mongoose");
app.use(express.json());
const cors = require("cors");
app.use(cors());

app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: false}));

var nodemailer = require('nodemailer');

const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");

const JWT_SECRET = "agdsbfbs()jkfnas()2353287535324?><erfa[]s";

const mongoUrl = "mongodb+srv://tamaianrares:NQgr2heKpKA2aHK9@cluster0.vcwvi16.mongodb.net/?retryWrites=true&w=majority";
mongoose.connect(mongoUrl,{
    useNewUrlParser: true
}).then(()=>{
    console.log("connected to db")
}).catch((e)=>console.log(e))

app.listen(5000,()=>{
    console.log("Server Started");
})
app.post("/post", async(req, res)=>{
    console.log(req.body);
    const {data} = req.body;

    try{
        if(data == "rares"){
            res.send({status: "ok"})
        }else{
            res.send({status: "User Not found"})
        }
    } catch(error){
        res.send({status:"error"})
    }
});

require("./userDetails");
require("./userDns");
const User = mongoose.model("UserInfo");
const UserDns = mongoose.model("UserDns");
app.post("/register", async(req,res)=>{
    const {fname, lname, email, password, userType} = req.body;
    const encryptedPassword = await bcrypt.hash(password, 10);
    try{
        const oldUser = await User.findOne({email});
        if(oldUser) {
            return res.send({error: "User Exists"})
        }
        await User.create({
            fname,// same as fname:fname but the names are the same so no need to write key value pairs
            lname,
            email,
            password: encryptedPassword,
            userType
        });
        res.send({status: "OK"})
    } catch(error){
        res.send({status: "error"})
    }
});
app.post("/addDns", async(req,res)=>{
    const options_reverse = {
        "$origin": "0.168.192.IN-ADDR.ARPA.",
	"$ttl": 3600,
	"soa": {
		"mname": "NS1.NAMESERVER.NET.",
		"rname": "HOSTMASTER.MYDOMAIN.COM.",
		"serial": "{time}",
		"refresh": 3600,
		"retry": 600,
		"expire": 604800,
		"minimum": 86400
	},
  "ns": [
      { "host": "NS1.NAMESERVER.NET." },
      { "host": "NS2.NAMESERVER.NET." }
  ],
  "ptr":[
      { "name": 1, "host": "HOST1.MYDOMAIN.COM." },
      { "name": 2, "host": "HOST2.MYDOMAIN.COM." }
  ]
    }
    const options = {
        "$origin": "MYDOMAIN.COM.",
        "$ttl": 3600,
        "soa": {
            "mname": "NS1.NAMESERVER.NET.",
            "rname": "HOSTMASTER.MYDOMAIN.COM.",
            "serial": "{time}",
            "refresh": 3600,
            "retry": 600,
            "expire": 604800,
            "minimum": 86400
        },
        "ns": [
            { "host": "NS1.NAMESERVER.NET." },
            { "host": "NS2.NAMESERVER.NET." }
        ],
        "a": [
            { "name": "@", "ip": "127.0.0.1" },
            { "name": "www", "ip": "127.0.0.1" },
            { "name": "mail", "ip": "127.0.0.1" }
        ],
        "aaaa": [
            { "ip": "::1" },
            { "name": "mail", "ip": "2001:db8::1" }
        ],
        "cname":[
            { "name": "mail1", "alias": "mail" },
            { "name": "mail2", "alias": "mail" }
        ],
        "mx":[
            { "preference": 0, "host": "mail1" },
            { "preference": 10, "host": "mail2" }
        ],
        "txt":[
            { "name": "txt1", "txt": "hello" },
            { "name": "txt2", "txt": "world" }
        ],
        "srv":[
            { "name": "_xmpp-client._tcp", "target": "jabber", "priority": 10, "weight": 0, "port": 5222 },
            { "name": "_xmpp-server._tcp", "target": "jabber", "priority": 10, "weight": 0, "port": 5269 }
        ]
    }
    const output = zonefile.generate(options);
    console.log(output);
    const writeStream = fs.createWriteStream("FirstFile.txt");
    writeStream.write(output);
    writeStream.end();
    // const {user, dnsName} = req.body;
    // console.log(user, "user");
    // console.log(dnsName, "dnsName");
    console.log(req.body.userId, "userid");
    console.log(req.body.dnsName, "dnsName");
    try{
        // const oldUser = await User.findOne({email});
        // if(oldUser) {
        //     return res.send({error: "User Exists"})
        // }
        await UserDns.create({
            userId: req.body.userId,
            dnsName: req.body.dnsName
        });
        res.send({status: "ok"})
    } catch(error){
        console.log(error);
        res.send({status: "error"})
    }
});

app.post("/login-user", async(req, res)=>{
    const {email, password} = req.body;

    const user = await User.findOne({email});
    if(!user) {
        return res.json({error: "User Not found"})
    }
    if(await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({email: user.email}, JWT_SECRET, {
            expiresIn:"10m"
        });

        if(res.status(201)){//201 aka request is successful
            return res.json({status: "ok", data: token});
        } else{
            return res.json({error: "error"});
        }
    }
    res.json({status: "error", error: "Invalid Password"});
})
app.post("/userData", async(req,res)=>{
    const {token} = req.body;
    try{
        const user = jwt.verify(token, JWT_SECRET, (err, res)=>{
            if(err){
                return "token expired";
            }
            return res;
        });
        if(user == "token expired"){
            return res.send({status: "error", data: "token expired"})
        }
        const userEmail = user.email;
        User.findOne({email: userEmail})
        .then((data)=>{
            res.send({status: "ok", data: data})
        })
        .catch((error)=>{
            res.send({status: "error", data: error})
        });
    } catch(error){
        console.log(error, "userData error")
    }
})
app.post("/forgot-password", async(req, res)=>{
    const {email} = req.body;
    try {
        const oldUser = await User.findOne({email});
        if(!oldUser){
            return res.json({status: "User doesn't exist!"});
        }
        const secret = JWT_SECRET + oldUser.password;
        const token = jwt.sign({email: oldUser.email, id: oldUser._id}, secret, {
            expiresIn: "5m"  //5minutes
        });
        const link = `http://localhost:5000/reset-password/${oldUser._id}/${token}`;// link to be send to the user's mail
        var transporter = nodemailer.createTransport({
            // service: 'gmail',
            service: 'yahoo',
            auth: {
              user: 'rarres_da@yahoo.com',
              pass: 'zfwmgdufmvsldpfm'
            }
          });
          
          var mailOptions = {
            from: 'rarres_da@yahoo.com',
            to: email,
            subject: 'Password reset',
            text: link
          };
          
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
            }
          }); 
        console.log(link);
    } catch (error) {
        
    }
})
app.get("/reset-password/:id/:token", async(req, res)=>{
    const {id, token} = req.params;
    console.log(req.params);
    const oldUser = await User.findOne({_id: id});
    if(!oldUser){
        return res.json({status: "User doesn't exist!"});
    }
    const secret = JWT_SECRET + oldUser.password;
    try {
        const verify = jwt.verify(token, secret);
        res.render("index",{email: verify.email, status: "Password will change"});
    } catch (error) {
        res.send("Not Verified");
    }
});
app.post("/reset-password/:id/:token", async(req, res)=>{//nu tre sa scrii acirion in form ul din index ca stie automat ca e asta ca e diferit doar post in loc de get si atunci ia acelasi link
    const {id, token} = req.params;
    const {password} = req.body;//aici poti face validare ca cele 2 parole sa fie egale(pass si confirms pass)
    const oldUser = await User.findOne({_id: id});
    if(!oldUser){
        return res.json({status: "User doesn't exist!"});
    }
    const secret = JWT_SECRET + oldUser.password;
    try {
        const verify = jwt.verify(token, secret);
        const encryptedPassword = await bcrypt.hash(password, 10);
        await User.updateOne(
            {
                _id: id,
            },
            {
                $set: {
                    password: encryptedPassword,
                },
            }
        );
        // res.json({status: "Password Updated"});
        res.render("index",{email: verify.email, status: "Password Changed"});
    } catch (error) {
        res.json({status: "Something went wrong"});
    }
});
app.get("/getAllUsers", async(req,res)=>{
    try {
        const allUsers = await User.find({});//vezi daca tre object gol ca parametru sau nu
        res.send({status:"ok", data:allUsers});
    } catch (error) {
        console.log(error," get all users");
    }
});
app.post("/deleteUser", async (req, res) => {
    const {userId} = req.body;
    try {
        await User.deleteOne(
            {_id: userId});
            res.send({status: "ok", data: "Deleted user"});
    } catch (error) {
        console.log(error);
    }
});
app.post("/deleteDns", async (req, res) => {
    const {dnsId} = req.body;
    try {
        await UserDns.deleteOne(
            {_id: dnsId});
            res.send({status: "ok", data: "Deleted dns"});
    } catch (error) {
        console.log(error);
    }
});
app.post("/getUser", async (req, res) => {
    const userId = req.body.id;
    // console.log(userId, "body that gets to the server");
    try {
        const user = await User.findOne({_id: userId});
        res.send({status: "ok", data: user});
    } catch (error) {
        console.log(error, " getUser error");
    }
});
app.post("/getDns", async (req, res) => {
    const dnsId = req.body.id;
    // console.log(userId, "body that gets to the server");
    try {
        const dns = await UserDns.findOne({_id: dnsId});
        res.send({status: "ok", data: dns});
    } catch (error) {
        console.log(error, " getDns error");
    }
});
app.post("/getAllDnsByUser", async (req, res) => {
    // const userId = req.body._id;
    const userId = req.body.id;
    // const userId = req.body;
    console.log("this is the body", req.body);
    console.log(userId, "user id that gets to the server");
    try {
        const allDns = await UserDns.find({userId: userId});
        res.send({status: "ok", data: allDns});
    } catch (error) {
        console.log(error, "getAllDnsByUser error");
    }
});
app.post("/updateUser", async(req, res)=>{
    const user = req.body;
    const userId = user._id;
    console.log("updateUser body:", user);
    console.log("updateUser id:", user._id);
    const oldUser = await User.findOne({_id: userId});
    if(!oldUser){
        return res.json({status: "User doesn't exist!"});
    }
    try {
        await User.updateOne(
            {
                _id: userId,
            },
            {
                $set: {
                    fname: user.fname,
                    lname: user.lname,
                    email: user.email
                },
            }
        );
        // res.json({status: "Password Updated"});
        // res.render("index",{email: verify.email, status: "Password Changed"});
        res.json({status: "ok"})
    } catch (error) {
        res.json({status: "Something went wrong"});
    }
});
app.post("/updateDns", async(req, res)=>{
    const dns = req.body;
    const dnsId = dns._id;
    const oldDns = await UserDns.findOne({_id: dnsId});
    if(!oldDns){
        return res.json({status: "This dns doesn't exist!"});
    }
    try {
        await UserDns.updateOne(
            {
                _id: dnsId,
            },
            {
                $set: {
                    dnsName: dns.dnsName,
                },
            }
        );
        // res.json({status: "Password Updated"});
        // res.render("index",{email: verify.email, status: "Password Changed"});
        res.json({status: "ok"})
    } catch (error) {
        res.json({status: "Something went wrong"});
    }
});