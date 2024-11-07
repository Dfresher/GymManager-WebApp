const express = require("express");
const cors = require("cors");
const mysql = require("mysql");
const path = require("path");
const { v4: uuid4v } = require("uuid");
const dayjs = require("dayjs");

const app = express();

app.use(express.static(path.join(__dirname, "public")));
app.use(cors());
app.use(express.json());

const port = 5000;

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "gym_logistics",
});

const users = [{ email: "admin@gmail.com", password: "contraseña123" }];

app.post("/login", (req, res) => {
  const user = users.find(
    (u) => u.email === req.body.email && u.password === req.body.password
  );

  if (user) {
    return res.json({ token: "your-auth-token" });
  } else {
    return res.status(401).json({ message: "Credenciales invalidas" });
  }
});

app.post("/add_client", (req, res) => {
  sql =
    "INSERT INTO clientes (`ClienteID`, `Nombre`, `Apellido`, `Cedula`, `Edad`, `Email`, `Telefono`, `Direccion`, `FechaRegistro`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
  const id = uuid4v();
  const values = [
    id,
    req.body.firstName,
    req.body.lastName,
    req.body.cedula,
    req.body.age,
    req.body.email,
    req.body.contact,
    req.body.address,
    req.body.date,
  ];
  db.query(sql, values, (err, result) => {
    if (err)
      return res.json({
        message: "Algo salio mal agregando el cliente: " + err,
      });
    return res.json({ success: "Cliente añadido exitosamente!" });
  });
});

app.put("/edit_client", (req, res) => {
  sql =
    "UPDATE clientes SET Nombre = ?, Apellido = ?, Cedula = ?, Edad = ?, Email = ?, Telefono = ?, Direccion = ?, FechaRegistro = ? WHERE ClienteID = ?";
  const values = [
    req.body.firstName,
    req.body.lastName,
    req.body.cedula,
    req.body.age,
    req.body.email,
    req.body.contact,
    req.body.address,
    req.body.date,
    req.body.ClienteID,
  ];
  db.query(sql, values, (err, result) => {
    if (err)
      return res.json({
        message: "Algo salio mal editando el cliente: " + err,
      });
    return res.json({ success: "Cliente editado exitosamente!" });
  });
});

app.post("/delete_client", (req, res) => {
  const sql = "DELETE FROM clientes WHERE ClienteID = ?;";
  const values = [req.body.ClienteID];
  db.query(sql, values, (err, result) => {
    if (err)
      return res.json({
        message: "Algo salio mal eliminando el cliente: " + err,
      });
    return res.json({ success: "Cliente eliminado exitosamente!" });
  });
});

app.post("/add_payment", (req, res) => {
  const sql =
    "INSERT INTO pagos (`PagoID`, `ClienteID`, `Monto`, `FechaPago`) VALUES (?, ?, ?, ?)";
  const id = uuid4v();
  const values = [id, req.body.clientID, req.body.amount, req.body.date];
  db.query(sql, values, (err, result) => {
    if (err)
      return res.json({
        message: "Algo salio mal procesando el pago: " + err,
      });
    return res.json({ success: "Pago procesado exitosamente!" });
  });
});

app.post("/attendance/checkin", (req, res) => {
  const updateClienteStatus =
    "UPDATE clientes SET Registrado = 1 WHERE ClienteID = ?";
  const addAsistenciaRecord =
    "INSERT INTO asistencias (`AsistenciaID`, `ClienteID`, `FechaAsistencia`, `HoraLlegada`) VALUES (?, ?, ?, ?)";
  const id = uuid4v();
  const date = dayjs().format("YYYY-MM-DD");
  const checkInTime = dayjs().format("HH:mm:ss");

  db.query(updateClienteStatus, [req.body.clientID], (err) => {
    if (err)
      return res
        .status(500)
        .json({ message: "Algo salio mal actualizando el cliente: " + err });
    db.query(
      addAsistenciaRecord,
      [id, req.body.clientID, date, checkInTime],
      (err) => {
        if (err)
          return res.status(500).json({
            message: "Algo salio mal agregando la asistencia: " + err,
          });
        res.json({ success: "Entrada registrada exitosamente!" });
      }
    );
  });
});

app.post("/attendance/checkout", (req, res) => {
  const updateClienteStatus =
    "UPDATE clientes SET Registrado = 0 WHERE ClienteID = ?";
  const updateAsistenciaRecord =
    "UPDATE asistencias SET HoraSalida = ? WHERE ClienteID = ? AND FechaAsistencia = ? AND HoraSalida IS NULL";

  const date = dayjs().format("YYYY-MM-DD");
  const checkOutTime = dayjs().format("HH:mm:ss");

  db.query(
    updateAsistenciaRecord,
    [checkOutTime, req.body.clientID, date],
    (err) => {
      if (err)
        return res.status(500).json({
          message: "Algo salio mal actualizando la asistencia: " + err,
        });
      db.query(updateClienteStatus, [req.body.clientID], (err) => {
        if (err)
          return res.status(500).json({
            message: "Algo salio mal actualizando el cliente: " + err,
          });
        res.json({ success: "Salida registrada exitosamente!" });
      });
    }
  );
});

app.get("/attendance/status", (req, res) => {
  const sql =
    "SELECT ClienteID, Registrado FROM asistencias WHERE FechaAsistencia = ?";
  const values = [dayjs().format("YYYY-MM-DD")];

  db.query(sql, values, (err, result) => {
    if (err) return res.json({ message: "Error del servidor" });
    return res.json(result);
  });
});

app.get("/get_clients", (req, res) => {
  const sql = "SELECT * FROM clientes";
  db.query(sql, (err, result) => {
    if (err) res.json({ message: "Error del servidor" });
    return res.json(result);
  });
});

app.get("/get_payments", (req, res) => {
  const sql =
    "SELECT * FROM clientes JOIN pagos ON clientes.ClienteID = pagos.ClienteID";
  db.query(sql, (err, result) => {
    if (err) res.json({ message: "Error del servidor" });
    return res.json(result);
  });
});

app.get("/attendance", (req, res) => {
  const sql =
    "SELECT * FROM clientes JOIN asistencias ON clientes.ClienteID = asistencias.ClienteID";
  db.query(sql, (err, result) => {
    if (err) res.json({ message: "Error del servidor" });
    return res.json(result);
  });
});

app.listen(port, () => {
  console.log("RUNNING");
});
