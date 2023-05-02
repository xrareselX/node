const mongoose = require("mongoose");
//create a schema
// require("./userDetails");
const UserDnsSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserInfo"
        },
        dnsName: String,
    },
    {
        collection: "UserDns",//this is where it is stored in the mongo server
    }
);
//create a model named UserInfo for the schema; this model will be used to do stuff to the database
mongoose.model("UserDns", UserDnsSchema);