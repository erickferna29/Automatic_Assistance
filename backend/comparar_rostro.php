<?php
require "connectdb.php"; // Usa tu archivo de conexión

// Recibir la imagen cruda del ESP32
$imgData = file_get_contents("php://input");
if (!$imgData) {
    die(json_encode(["status" => "error", "message" => "No se recibio imagen"]));
}

$temp_file = sys_get_temp_dir() . '/capture.jpg';
file_put_contents($temp_file, $imgData);

// Enviar a FastAPI (contenedor face_recognition puerto 5001)
$ch = curl_init("http://face_recognition:5001/comparar");
$cfile = new CURLFile($temp_file, 'image/jpeg', 'foto.jpg');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, ['foto' => $cfile]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$result = json_decode($response, true);
curl_close($ch);
unlink($temp_file);

if (isset($result['status']) && $result['status'] === 'success') {
    $no_cuenta = $result['no_cuenta'];
    
    // Aquí insertas en tu tabla de Asistencia
    // Nota: Ajusta 'codigo_materia' según cómo manejes la clase actual
    $stmt = $conexion->prepare("INSERT INTO Asistencia (id_alumno, fecha, hora, codigo_materia) VALUES (?, CURDATE(), CURTIME(), 'MAT001')");
    $stmt->bind_param("i", $no_cuenta);
    
    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "alumno" => $no_cuenta]);
    } else {
        echo json_encode(["status" => "error", "message" => "Error al registrar en BD"]);
    }
} else {
    echo json_encode($result);
}
?>