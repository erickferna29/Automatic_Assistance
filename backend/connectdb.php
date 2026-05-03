<?php
$servername = "db_asistencia"; 
$username = "root";
$pwd = "asisT3ncia";      
$dbname = "sistema_asistencia"; 

$conexion = new mysqli($servername, $username, $pwd, $dbname);

header("Access-Control-Allow-Origin: *"); 
header("Content-Type: application/json");

if($conexion->connect_error) {
    die(json_encode([
        "status" => "error",
        "message" => "Conexión fallida: " . $conexion->connect_error
    ]));
}

$conexion->set_charset("utf8");
?>