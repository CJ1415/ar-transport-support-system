const jwt = require("jsonwebtoken")
const JWT_SECRET = process.env.JWT_SECRET


module.exports = (req, res, next) => {
    // try to get the header ragardless of caps
    const rawHeader = req.headers['authori  zation'] || req.headers['Authorization'] || req.header('Authorization');

    if (!rawHeader) {
        return res.status(401).json({message: "Access Denied: No Header Found"});
    }

    // remove the 'Bearer' from the token so only the token is parsed (this was such a headache of a bug)
    const token = rawHeader.startsWith('Bearer ') 
        ? rawHeader.slice(7) 
        : rawHeader;

    try {
        // verify the token and JWT_SECRET to ensure valid access
        const verified = jwt.verify(token, JWT_SECRET); 
        req.user = verified;
        next();
    } catch (err) {
        console.log("JWT Verify Error:", err.message);
        res.status(400).json({message: "Invalid Token", error: err.message});
    }
};
