const jwt = require("jsonwebtoken");
const JWT_SECRET = "thisissecretdonotshare";
const auth = (req, res, next) => {
    //get the user from the jwt token and add id to req object
    let token = req.header('Authorization');
    // console.log(token);
    if (!token) {
        res.status(401).send({ error: "please send valid auth-token" });
    }
    try {
        token=token.split(" ")[1];
        const data = jwt.verify(token, JWT_SECRET);
        //  console.log(data);
        req.user = data.user;
        next();
    }
    catch (error) {
        console.log(error);
        res.status(401).send({ error: "Token you send is invalid" });
    }

}
module.exports = auth;