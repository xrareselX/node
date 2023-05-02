const mongoose = require("mongoose");
//create a schema
const UserDetailsSchema = new mongoose.Schema(
    {
        fname: String,
        lname: String,
        email: {type: String, unique: true},
        password: String,
        userType: String,
    },
    {
        collection: "UserInfo",//this is where it is stored in the mongo server
    }
);
//create a model named UserInfo for the schema; this model will be used to do stuff to the database
mongoose.model("UserInfo", UserDetailsSchema);