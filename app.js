const express = require("express");
const cors = require("cors");

const app = express();
const port = 3000;

app.use(cors());

app.get("/", (req, res) => {
  res.send("Bye Earth!");
});

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
