-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Servidor: db_asistencia:3306
-- Tiempo de generación: 14-05-2026 a las 18:36:34
-- Versión del servidor: 10.11.16-MariaDB-ubu2204
-- Versión de PHP: 8.3.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `Automatic_Asistance`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Alumnos`
--

CREATE TABLE `Alumnos` (
  `no_cuenta` int(11) NOT NULL,
  `nombres` varchar(100) DEFAULT NULL,
  `apellido_paterno` varchar(50) DEFAULT NULL,
  `apellido_materno` varchar(50) DEFAULT NULL,
  `carrera` varchar(100) DEFAULT NULL,
  `grupo` varchar(10) DEFAULT NULL,
  `grado` int(10) DEFAULT NULL,
  `foto` varchar(250) DEFAULT NULL,
  `nip` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `Alumnos`
--

INSERT INTO `Alumnos` (`no_cuenta`, `nombres`, `apellido_paterno`, `apellido_materno`, `carrera`, `grupo`, `grado`, `foto`, `nip`) VALUES
(14076055, 'ISRAEL', 'MEDINA', 'CHAVEZ', 'IS', '1', 3, NULL, NULL),
(15004899, 'ROSA KARINA', 'ROSAS', 'BURGUEÑO', 'IS', '2', 3, NULL, NULL),
(15008754, 'CARLOS ALAN', 'ABOYTE', 'MARTINEZ', 'IS', '2', 3, NULL, NULL),
(15060411, 'DANYAEL', 'JUAN QUI', 'MENDOZA', 'IS', '3', 2, NULL, NULL),
(15065014, 'DAVID IRAM', 'MONTES', 'GARCIA', 'IS', '1', 3, NULL, NULL),
(16000668, 'PAUL', 'URIAS', 'VALENZUELA', 'IS', '1', 3, NULL, NULL),
(16032063, 'JOSE GUADALUPE', 'GUTIERREZ', 'VALDEZ', 'IS', '1', 3, NULL, NULL),
(16063457, 'JOAK ANTONIO', 'HERRERA', 'SANTOS', 'IS', '3', 2, NULL, NULL),
(17000416, 'MIRIAM IVETH', 'DELGADO', 'GALAVIZ', 'IS', '2', 3, NULL, NULL),
(17000459, 'ANGELA DARINKA', 'QUIÑONEZ', 'REYES', 'IS', '1', 3, NULL, NULL),
(17001331, 'OMAR ALEJANDRO', 'MENDOZA', 'SOLIS', 'IS', '1', 2, NULL, NULL),
(17002125, 'BRYANT OBED', 'DIAZ DE LEON', 'ACEBEDO', 'IS', '3', 3, NULL, NULL),
(17035351, 'ANGEL GUADALUPE', 'ROCHA', 'PALOMARES', 'IS', '1', 3, NULL, NULL),
(18001106, 'MIGUEL ANGEL', 'AVILA', 'DAVIZON', 'IS', '1', 2, NULL, NULL),
(18001572, 'JOSUE', 'VEGA', 'GALLARDO', 'IS', '2', 3, NULL, NULL),
(18002285, 'JESUS GABRIEL', 'HERNANDEZ', 'CAMACHO', 'IS', '2', 2, NULL, NULL),
(18002595, 'JUAN IGNACIO', 'VILLEGAS', 'GRIJALVA', 'IS', '1', 2, NULL, NULL),
(18002633, 'JAIME OMAR', 'ESCALANTE', 'SOTO', 'IS', '1', 3, NULL, NULL),
(18003532, 'TRAVIS', 'SANTOS', 'IBARRA', 'IS', '3', 2, NULL, NULL),
(18004520, 'ANGEL URIEL', 'REYES', 'SAMANIEGO', 'IS', '3', 3, NULL, NULL),
(18004768, 'ALEX', 'GAMBOA', 'MORALES', 'IS', '2', 2, NULL, NULL),
(18024793, 'DARWIN OMAR', 'LOPEZ', 'PEÑUELAS', 'IS', '3', 2, NULL, NULL),
(18034047, 'KEVIN LEONARDO', 'LEYVA', 'GUERRERO', 'IS', '2', 3, NULL, NULL),
(18055230, 'YESENIA SUJEY', 'LOPEZ', 'COTA', 'IS', '3', 2, NULL, NULL),
(18078583, 'RAUL EDUARDO', 'HERNANDEZ', 'GARCIA', 'IS', '1', 3, NULL, NULL),
(19000790, 'FRANCISCO JAVIER', 'PAREDES', 'GUZMAN', 'IS', '1', 2, NULL, NULL),
(19001479, 'EDUARDO', 'MARTINEZ', 'MONTES', 'IS', '1', 2, NULL, NULL),
(19002351, 'FLERIDA ROMINA', 'ALCARAZ', 'PEREZ', 'IS', '2', 2, NULL, NULL),
(19003145, 'VANYA LUCIA', 'CARRANZA', 'IBARRA', 'IS', '1', 2, NULL, NULL),
(19053177, 'JESUS OCTAVIO', 'FELIX', 'ROBLES', 'IS', '3', 2, NULL, NULL),
(19053622, 'SARA ALIN', 'IBARRA', 'RODRIGUEZ', 'IS', '3', 2, NULL, NULL),
(19057474, 'LUIS MARIO', 'BALDENEBRO', 'QUIROZ', 'IS', '1', 3, NULL, NULL),
(20000111, 'ADRIAN TADEO', 'MONTES', 'VAZQUEZ', 'IS', '2', 3, NULL, NULL),
(20000758, 'JOSE MARIA', 'MARTINEZ', 'SAUCEDA', 'IS', '3', 2, NULL, NULL),
(20002599, 'DIEGO', 'LIERA', 'PAYAN', 'IS', '2', 3, NULL, NULL),
(20025688, 'SEBASTIAN', 'CERVANTES', 'CASTRO', 'IS', '1', 3, NULL, NULL),
(20026668, 'MIRANDA', 'COTA', 'BORBOA', 'IS', '2', 3, NULL, NULL),
(20028059, 'BRUNO RAYMUNDO', 'LIRA', 'AHUMADA', 'IS', '2', 3, NULL, NULL),
(20029012, 'JOHAN ALBERTO', 'QUIÑONEZ', 'FELIX', 'IS', '2', 3, NULL, NULL),
(20033966, 'JESUS SEBASTIAN', 'MACHADO', 'GALLEGOS', 'IS', '2', 3, NULL, NULL),
(20034474, 'ISMAEL ALBERTO', 'ROSAS', 'BARRAGAN', 'IS', '2', 3, NULL, NULL),
(20038933, 'CARLOS HUMBERTO', 'URIAS', 'APODACA', 'IS', '2', 3, NULL, NULL),
(20039123, 'ANGEL ALFREDO', 'CERVANTES', 'GIL', 'IS', '2', 3, NULL, NULL),
(20039336, 'JOSE MANRIQUE', 'TRASVIÑA', 'VALENCIA', 'IS', '3', 2, NULL, NULL),
(20050968, 'DIEGO MANUEL', 'ESPIRITU', 'MANZANAREZ', 'IS', '2', 3, NULL, NULL),
(20051931, 'CARLOS AGUSTIN', 'LERMA', 'FELIX', 'IS', '1', 2, NULL, NULL),
(20052758, 'JOSE MIGUEL', 'BOJORQUEZ', 'AVALOS', 'IS', '1', 3, NULL, NULL),
(20053185, 'LEONEL FERNANDO', 'OSORIO', 'ENCINAS', 'IS', '1', 3, NULL, NULL),
(20055722, 'SEAN JOSUE', 'MURO', 'LOPEZ', 'IS', '1', 3, NULL, NULL),
(20056907, 'DANIEL HUMBERTO', 'LEYVA', 'CHAVEZ', 'IS', '2', 3, NULL, NULL),
(20057482, 'SERGIO', 'RIVERA', 'CAMACHO', 'IS', '2', 3, NULL, NULL),
(20059272, 'JESUS ANDRES', 'FIERRO', 'GONZALEZ', 'IS', '1', 3, NULL, NULL),
(20062109, 'JESUS ALBERTO', 'BERRELLEZA', 'COTA', 'IS', '2', 3, NULL, NULL),
(20064624, 'CARLOS DAVID', 'COTA', 'SAÑUDO', 'IS', '1', 3, NULL, NULL),
(20066678, 'SAMUEL', 'IBARRA', 'GARCIA', 'IS', '3', 2, NULL, NULL),
(20066783, 'GRETEL ADINAI', 'BOJORQUEZ', 'QUIROZ', 'IS', '3', 2, NULL, NULL),
(20079036, 'RAUL', 'CERVANTES', 'LOPEZ', 'IS', '1', 3, NULL, NULL),
(20083890, 'LUIS ANTONIO', 'CAZARES', 'SANCHEZ', 'IS', '1', 3, NULL, NULL),
(20104456, 'VICTOR URIEL', 'RIOS', 'MARTINEZ', 'IS', '3', 2, NULL, NULL),
(20105347, 'OSCAR ALBERTO', 'RODRIGUEZ', 'MENDEZ', 'IS', '3', 2, NULL, NULL),
(20170254, 'ERIK', 'ORTIZ', 'LEAL', 'IS', '1', 3, NULL, NULL),
(20195400, 'CARLOS IGNACIO', 'VERDUZCO', 'GASTELUM', 'IS', '2', 3, NULL, NULL),
(20196891, 'JOSHUA MATTHEW', 'RAMIREZ', 'CASTILLO', 'IS', '2', 2, NULL, NULL),
(20229534, 'JESUS RICARDO', 'ORRANTIA', 'MIRANDA', 'IS', '2', 3, NULL, NULL),
(21152004, 'ALEJANDRO', 'CABANILLAS', 'ALVARADO', 'IS', '3', 3, NULL, NULL),
(21152063, 'ANGELA DEL ROSARIO', 'CHAPARRO', 'PADILLA', 'IS', '3', 2, NULL, NULL),
(21420041, 'CARLOS FERNANDO', 'PEINADO', 'FELIX', 'IS', '1', 2, NULL, NULL),
(21420221, 'MILTON OMAR', 'APODACA', 'ROMERO', 'IS', '2', 2, NULL, NULL),
(21420882, 'ALISON MICHELLE', 'FELIX', 'MEDINA', 'IS', '1', 2, NULL, NULL),
(21420890, 'ASHLY PAULINA', 'FELIX', 'VALDEZ', 'IS', '2', 2, NULL, NULL),
(21420971, 'IAN RICARDO', 'ARECHIGA', 'MIRANDA', 'IS', '2', 2, NULL, NULL),
(21421099, 'CESAR ALEJANDRO', 'LOPEZ', 'PEREZ', 'IS', '3', 2, NULL, NULL),
(21425566, 'JOSE ALONSO', 'AYALA', 'CAMARGO', 'IS', '2', 2, NULL, NULL),
(21426211, 'JOSE MANUEL', 'AGUALLO', 'GIL', 'IS', '2', 2, NULL, NULL),
(21430357, 'ABRIL ALEJANDRA', 'GAMBOA', 'RAMOS', 'IS', '1', 2, NULL, NULL),
(21430489, 'VICTOR LEONARDO', 'OSUNA', 'DE LA CRUZ', 'IS', '2', 2, NULL, NULL),
(21437041, 'FRANSEV ARGENIS', 'PARRA', 'URIAS', 'IS', '2', 2, NULL, NULL),
(21437238, 'JESUS ALFREDO', 'RODRIGUEZ', 'QUIROS', 'IS', '2', 2, NULL, NULL),
(21437947, 'WILBERTH EDEN', 'SAÑUDO', 'CORRAL', 'IS', '3', 2, NULL, NULL),
(21442835, 'LUIS MANUEL', 'INZUNZA', 'ARMENTA', 'IS', '2', 2, NULL, NULL),
(21443017, 'CAROLINA DENISSE', 'SOTO', 'BARBOSA', 'IS', '1', 2, NULL, NULL),
(21443084, 'CARLOS GEOVANNY', 'MARTINEZ', 'LEYVA', 'IS', '1', 2, NULL, NULL),
(21443785, 'AARON ESTEBAN', 'ORTEGA', 'VAZQUEZ', 'IS', '1', 2, NULL, NULL),
(21443831, 'GUSTAVO', 'ARAUJO', 'PEREZ', 'IS', '2', 2, NULL, NULL),
(21446105, 'JUAN PABLO', 'FLORES', 'SOTO', 'IS', '1', 2, NULL, NULL),
(21446601, 'ABRIL Yamilett', 'HERALDEZ', 'MEDINA', 'IS', '2', 2, NULL, NULL),
(21446946, 'JACIEL', 'RUBIO', 'ESPINOZA', 'IS', '2', 2, NULL, NULL),
(21446997, 'JESUS ALFREDO', 'VALENCIA', 'LUNA', 'IS', '2', 2, NULL, NULL),
(21447268, 'CARLOS DANIEL', 'DELGADO', 'VILLARREAL', 'IS', '1', 2, NULL, NULL),
(21456054, 'FABIOLA', 'FERNANDEZ', 'FELIX', 'IS', '2', 2, NULL, NULL),
(21456127, 'MIGUEL IGNACIO', 'PALAFOX', 'FELIX', 'IS', '1', 2, NULL, NULL),
(21456623, 'BRAYAN ENRIQUE', 'CONTRERAS', 'REYES', 'IS', '2', 2, NULL, NULL),
(21513139, 'CHRISTIAN ARMANDO', 'CORTEZ', 'HERNANDEZ', 'IS', '2', 2, NULL, NULL),
(21518041, 'LEONIDES', 'DIAZ DE LEON', 'LOPEZ', 'IS', '1', 2, NULL, NULL),
(21796378, 'JULIO ALFREDO', 'ARMENTA', 'CAMARENA', 'IS', '2', 2, NULL, NULL),
(21806918, 'JAVIER FERNANDO', 'LOPEZ', 'PONCE', 'IS', '3', 2, NULL, NULL),
(21810311, 'DANIEL ULISES', 'ARMENDARIZ', 'GASTELUM', 'IS', '1', 2, NULL, NULL),
(21811504, 'JOSE EDUARDO', 'AISPURO', 'CUEVAS', 'IS', '1', 2, NULL, NULL),
(21812233, 'JOSE ISMAEL', 'ROMERO', 'MARTINEZ', 'IS', '3', 2, NULL, NULL),
(21812241, 'ANGEL GABRIEL', 'IBARRA', 'RODRIGUEZ', 'IS', '3', 2, NULL, NULL),
(21812349, 'YOHAN FERNANDO', 'ZAVALA', 'ACOSTA', 'IS', '3', 2, NULL, NULL),
(21812764, 'GAEL', 'FLORES', 'GAXIOLA', 'IS', '1', 2, NULL, NULL),
(21814058, 'CARLOS IGNACIO', 'FIERRO', 'ORDUÑO', 'IS', '2', 2, NULL, NULL),
(21814341, 'PAULINA JOSELYNE', 'RODRIGUEZ', 'GAMEZ', 'IS', '1', 2, NULL, NULL),
(21827052, 'NATALIE ALEXANDRA', 'PEREZ', 'CHANONA', 'IS', '2', 2, NULL, NULL),
(21832226, 'MIGUEL ANGEL', 'ACOSTA', 'ROIZ', 'IS', '1', 2, NULL, NULL),
(22141545, 'JULIA ITZAYANA', 'PUENTE', 'VALENZUELA', 'IS', '3', 3, NULL, NULL),
(22141642, 'LUIS ANGEL', 'VILLEGAS', 'ROBLES', 'IS', '3', 2, NULL, NULL),
(22141693, 'DANTE ENRIQUE', 'ARMENTA', 'COTA', 'IS', '3', 3, NULL, NULL),
(22141741, 'LILLY ELIETTE', 'CHIPRES', 'CHACON', 'IS', '3', 2, NULL, NULL),
(22141758, 'IVAN ALBERTO', 'DE LA CRUZ', 'TORRES', 'IS', '3', 2, NULL, NULL),
(22142071, 'RICARDO GAEL', 'RIVERA', 'OSUNA', 'IS', '3', 2, NULL, NULL),
(22142551, 'MANUEL ABEL', 'DONEZ', 'HERNANDEZ', 'IS', '3', 3, NULL, NULL),
(22379282, 'JUAN CARLOS', 'MOCTEZUMA', 'RUELAS', 'IS', '3', 2, NULL, NULL),
(22574174, 'JUAN ANTONIO', 'STEPHENS', 'MORENO', 'IS', '2', 2, NULL, NULL),
(22591605, 'MANUEL ARTURO', 'SANCHEZ', 'ARMENTA', 'IS', '3', 2, NULL, NULL),
(23102551, 'ROBERTO', 'FLORES', 'QUINTERO', 'IS', '3', 2, NULL, NULL),
(23122617, 'EDGAR ABEL', 'CRUZ', 'LERMA', 'IS', '3', 2, NULL, NULL),
(23122625, 'JOSE ALDAIR', 'GARCIA', 'VALDEZ', 'IS', '1', 3, NULL, NULL),
(23122633, 'IKER ANDRE', 'LEYVA', 'COTA', 'IS', '2', 3, NULL, NULL),
(23122641, 'ANNA KAROL', 'OSUNA', 'RODRIGUEZ', 'IS', '2', 3, NULL, NULL),
(23122651, 'SEBASTIAN', 'SANCHEZ', 'GARCIA', 'IS', '3', 2, NULL, NULL),
(23122668, 'ALAN ABRAHAM', 'PEÑA', 'NAVA', 'IS', '2', 3, NULL, NULL),
(23122676, 'EDUARDO ENRIQUE', 'ESTRADA', 'RODRIGUEZ', 'IS', '3', 2, NULL, NULL),
(23122692, 'LUIS HUMBERTO', 'ALFARO', 'LOPEZ', 'IS', '1', 3, NULL, NULL),
(23122722, 'ADIEL IBHAR', 'GOMEZ', 'GARCIA', 'IS', '2', 3, NULL, NULL),
(23122730, 'MARIA LETICIA', 'MUÑOZ', 'CARLON', 'IS', '1', 3, NULL, NULL),
(23122749, 'HUMBERTO', 'AYALA', 'ZAVALA', 'IS', '1', 3, NULL, NULL),
(23122765, 'ELIAS ENRIQUE', 'MEXIA', 'GUTIERREZ', 'IS', '1', 3, NULL, NULL),
(23122773, 'ALEXANDER DE JESUS', 'VEGA', 'AYALA', 'IS', '1', 3, NULL, NULL),
(23122781, 'DANIEL TADEO', 'VILLEGAS', 'CABALLERO', 'IS', '1', 3, NULL, NULL),
(23122803, 'XIMENA', 'RODRIGUEZ', 'LEY', 'IS', '3', 3, NULL, NULL),
(23122821, 'MANUEL ERNESTO', 'ROSAS', 'CASTRO', 'IS', '2', 3, NULL, NULL),
(23122838, 'MIGUEL', 'SOTO', 'SOL', 'IS', '2', 3, NULL, NULL),
(23122846, 'DIEGO', 'BARRERAS', 'PEÑA', 'IS', '2', 3, NULL, NULL),
(23122854, 'JUAN PABLO', 'CAMPOS', 'CRUZ', 'IS', '2', 3, NULL, NULL),
(23122870, 'LUIS ANGEL', 'CRUZ', 'GALAVIZ', 'IS', '1', 3, NULL, NULL),
(23122889, 'AIRAM ADILE', 'ESCOBEDO', 'PEREZ', 'IS', '3', 2, NULL, NULL),
(23122897, 'KAMILA', 'RAMIREZ', 'GARCIA', 'IS', '1', 3, NULL, NULL),
(23122900, 'ELIAS', 'ROMERO VALDES', 'GOMEZ', 'IS', '2', 3, NULL, NULL),
(23122919, 'SAUL GUILEBALDO', 'COTA', 'OSUNA', 'IS', '3', 2, NULL, NULL),
(23122927, 'JOSE CARLOS', 'ESCALANTE', 'MENDOZA', 'IS', '1', 3, NULL, NULL),
(23122935, 'JUAN SEBASTIAN', 'LERMA', 'CEBREROS', 'IS', '2', 3, NULL, NULL),
(23122943, 'CAMILA MIGUELY', 'MACIAS', 'HERNANDEZ', 'IS', '2', 3, NULL, NULL),
(23122961, 'ERNESTO ALONSO', 'PEINADO', 'RABAGO', 'IS', '1', 3, NULL, NULL),
(23122986, 'JOSE LUIS', 'DIAZ', 'MONDACA', 'IS', '1', 3, NULL, NULL),
(23123001, 'REY DAVID', 'GAXIOLA', 'ARCE', 'IS', '1', 2, NULL, NULL),
(23123011, 'SEBASTIAN', 'MONJE', 'BOJORQUEZ', 'IS', '1', 3, NULL, NULL),
(23123028, 'JOSE DAVID', 'LEYVA', 'GRIJALVA', 'IS', '1', 3, NULL, NULL),
(23123036, 'RAUL ROBERTO', 'LUGO', 'SOTO', 'IS', '2', 3, NULL, NULL),
(23123052, 'ANGEL URIEL', 'VERDUGO', 'SEVILLA', 'IS', '1', 3, NULL, NULL),
(23123087, 'ANDRES ANTONIO', 'SAÑUDO', 'ZAMORANO', 'IS', '1', 3, NULL, NULL),
(23123095, 'CESAR MANUEL', 'URBINA', 'TRUJILLO', 'IS', '2', 3, NULL, NULL),
(23123125, 'JHAN CARLOS', 'ARREDONDO', 'LOPEZ', 'IS', '3', 2, NULL, NULL),
(23123133, 'JONATHAN ELIAN', 'ALCANTAR', 'CEDANO', 'IS', '1', 3, NULL, NULL),
(23123151, 'SANTIAGO', 'CHAPARRO', 'ESPINOZA', 'IS', '3', 2, NULL, NULL),
(23123214, 'VICTORIA MARBELLA', 'GONZALEZ', 'HUMO', 'IS', '2', 3, NULL, NULL),
(23123222, 'ISAAC ANTONIO', 'OROZCO', 'RAMOS', 'IS', '3', 2, NULL, NULL),
(23123230, 'CRISTIAN ALEXYS', 'VALDEZ', 'FING', 'IS', '3', 2, NULL, NULL),
(23123265, 'DIANA LAURA', 'GALLARDO', 'GONZALEZ', 'IS', '1', 3, NULL, NULL),
(23123321, 'HANSEL ISRAEL', 'CASTRO', 'FLORES', 'IS', '2', 3, NULL, NULL),
(23123362, 'LUIS DONALDO', 'LAUREAN', 'ACOSTA', 'IS', '2', 3, NULL, NULL),
(23123389, 'YEIDCKON ZAID', 'LUGO', 'URIAS', 'IS', '1', 3, NULL, NULL),
(23123397, 'ANGEL GUSTAVO', 'PACHECO', 'MEZA', 'IS', '1', 3, NULL, NULL),
(23123400, 'ALBERTO', 'TORRES', 'CHAPARRO', 'IS', '1', 3, NULL, NULL),
(23123419, 'MARCO GERARDO', 'GALVEZ', 'ARREDONDO', 'IS', '1', 3, NULL, NULL),
(23123435, 'JESUS EMMANUEL', 'BACASEGUA', 'GASTELUM', 'IS', '3', 2, NULL, NULL),
(23123575, 'HERIBERTO', 'RAMIREZ', 'RODRIGUEZ', 'IS', '3', 2, NULL, NULL),
(23123923, 'MARCO ANTONIO', 'VEGA', 'TORRES', 'IS', '3', 2, NULL, NULL),
(23124067, 'GERARDO MIGUEL', 'VAZQUEZ', 'NAVARRO', 'IS', '1', 3, NULL, NULL),
(23124131, 'JOAQUIN CRESCENCIO', 'PARTIDA', 'LOPEZ', 'IS', '3', 2, NULL, NULL),
(23124350, 'MARELY', 'PEÑUELAS', 'MENDIVIL', 'IS', '3', 3, NULL, NULL),
(23124369, 'JARED ALEJANDRO', 'ZAMARRIPA', 'MORENO', 'IS', '2', 3, NULL, NULL),
(23124441, 'OSCAR', 'VAZQUEZ', 'MIRANDA', 'IS', '2', 3, NULL, NULL),
(23124458, 'ANGEL JESUS', 'HUBBARD', 'PRECIADO', 'IS', '3', 2, NULL, NULL),
(23124695, 'HERNAN', 'ARENIVAS', 'SOTO', 'IS', '3', 3, NULL, NULL),
(23124725, 'DANNA ALEXANDRA', 'COLON', 'RODRIGUEZ', 'IS', '1', 3, NULL, NULL),
(23124784, 'CHRISTIAN EDUARDO', 'SOTO', 'PACHECO', 'IS', '3', 2, NULL, NULL),
(23502622, 'REBECA', 'LOPEZ', 'CASTRO', 'IS', '2', 2, NULL, NULL),
(24132731, 'JUAN JAIME', 'ABOYTES', 'MENA', 'IS', '2', 2, NULL, NULL),
(24132748, 'RAMON ALFONSO', 'AGUILAR', 'MILLAN', 'IS', '2', 2, NULL, NULL),
(24132764, 'JUAN ANTONIO', 'BECERRA', 'APODACA', 'IS', '1', 2, NULL, NULL),
(24132772, 'LIBNI MAGDIEL', 'BOJORQUEZ', 'CARDENAS', 'IS', '2', 2, NULL, NULL),
(24132780, 'ANGEL ANDRES', 'BUELNA', 'BOJORQUEZ', 'IS', '1', 2, NULL, NULL),
(24133345, 'NAOMI', 'FONG', 'BURGUEÑO', 'IS', '1', 2, NULL, NULL),
(24133353, 'LUIS ANGEL', 'FELIX', 'VALDEZ', 'IS', '2', 2, NULL, NULL),
(24133361, 'ZADKIEL ALI', 'ESPINOZA', 'SANCHEZ', 'IS', '1', 2, NULL, NULL),
(24133371, 'GERMAN ARMANDO', 'FELIX', 'ROBLES', 'IS', '1', 2, NULL, NULL),
(24133396, 'OMAR', 'GARCIA', 'ESPINOZA', 'IS', '3', 2, NULL, NULL),
(24133401, 'MIGUEL ENRIQUE', 'CAMARGO', 'LUGO', 'IS', '2', 2, NULL, NULL),
(24133418, 'ERICK RICARDO', 'CAMBEROS', 'CERECER', 'IS', '1', 2, NULL, NULL),
(24133434, 'MANUEL SEBASTIAN', 'CASTELLON', 'GONZALEZ', 'IS', '1', 2, NULL, NULL),
(24133450, 'JESUS ALFONSO', 'CASTRO', 'SEPULVEDA', 'IS', '1', 2, NULL, NULL),
(24133477, 'CESAR ADRIAN', 'LOPEZ', 'SAUCEDA', 'IS', '3', 2, NULL, NULL),
(24133485, 'JESUS ENRIQUE', 'OCHOA', 'VALENZUELA', 'IS', '3', 2, NULL, NULL),
(24133493, 'MANUEL DE JESUS', 'ORDUÑO', 'CASTREJON', 'IS', '1', 2, NULL, NULL),
(24133507, 'ANA CRISTINA', 'ORONA', 'SOTO', 'IS', '2', 2, NULL, NULL),
(24133523, 'JOSE LUIS', 'PEREA', 'ARMENTA', 'IS', '3', 2, NULL, NULL),
(24133558, 'BRYAN IVAN', 'AMEZCUA', 'TORRES', 'IS', '3', 2, NULL, NULL),
(24133566, 'LUCIEL', 'HERNANDEZ', 'ESTRADA', 'IS', '1', 2, NULL, NULL),
(24133574, 'YAMILL', 'HERNANDEZ', 'GASTELUM', 'IS', '2', 2, NULL, NULL),
(24133582, 'LUIS ENRIQUE', 'IBARRA', 'ELIZALDE', 'IS', '1', 2, NULL, NULL),
(24133590, 'FRANCISCO JAVIER', 'INZUNZA', 'PACHECO', 'IS', '2', 2, NULL, NULL),
(24133604, 'SANTIAGO', 'MONTERO', 'LUGO', 'IS', '3', 2, NULL, NULL),
(24133612, 'CRISTIAN LIBRADO', 'GARCIA', 'VALLE', 'IS', '3', 2, NULL, NULL),
(24133620, 'LUISPABLO', 'GOMEZ', 'COTA', 'IS', '1', 2, NULL, NULL),
(24133639, 'JOHAN ALAN', 'HARO', 'PEREA', 'IS', '3', 2, NULL, NULL),
(24133647, 'STEFANIA', 'KING', 'LOPEZ', 'IS', '1', 2, NULL, NULL),
(24133655, 'JESUS ADRIAN', 'LLANES', 'ORTEGA', 'IS', '2', 2, NULL, NULL),
(24133663, 'XIMENA', 'LOPEZ', 'MEDINA', 'IS', '2', 2, NULL, NULL),
(24133671, 'JULIO CESAR', 'LOPEZ', 'MORENO', 'IS', '2', 2, NULL, NULL),
(24133681, 'MARIO DAVID', 'LOPEZ', 'NAVAREZ', 'IS', '2', 2, NULL, NULL),
(24133698, 'LUIS EDUARDO', 'MANZANAREZ', 'RAMOS', 'IS', '1', 2, NULL, NULL),
(24133711, 'CESAR OSWALDO', 'MENDOZA', 'GUTIERREZ', 'IS', '2', 2, NULL, NULL),
(24133795, 'LUIZ RONALDO', 'RUBIO', 'GARIBAY', 'IS', '1', 2, NULL, NULL),
(24133809, 'JUAN PABLO', 'RUELAS', 'LOPEZ', 'IS', '1', 2, NULL, NULL),
(24133817, 'FERNANDO', 'CASTILLO', 'ONTIVEROS', 'IS', '3', 2, NULL, NULL),
(24133833, 'DIEGO', 'SANDOVAL', 'PATIÑO', 'IS', '3', 2, NULL, NULL),
(24133841, 'EMILY GUADALUPE', 'SANDOVAL', 'RAMIREZ', 'IS', '1', 2, NULL, NULL),
(24133851, 'GEMMA DARIANA', 'SANDOVAL', 'VALDEZ', 'IS', '1', 2, NULL, NULL),
(24133868, 'JESUS RAMON', 'SARMIENTO', 'GARCIA', 'IS', '2', 2, NULL, NULL),
(24133876, 'YAHIR AGUSTIN', 'SOTO', 'CAMPOS', 'IS', '2', 2, NULL, NULL),
(24133884, 'ELISANDRO', 'VALDEZ', 'MORENO', 'IS', '1', 2, NULL, NULL),
(24133892, 'LIBRADO', 'VALENZUELA', 'CAMPOS', 'IS', '3', 2, NULL, NULL),
(24133906, 'SERGIO EDUARDO', 'VERDUGO', 'ASTORGA', 'IS', '2', 2, NULL, NULL),
(24133914, 'CRISTIAN PABEL', 'VIDAÑA', 'HERRERA', 'IS', '1', 2, NULL, NULL),
(24133922, 'MARTIN ALFREDO', 'WILSON', 'TRASVIÑA', 'IS', '3', 2, NULL, NULL),
(24133930, 'ALAN JOSUE', 'ACOSTA', 'MARO', 'IS', '2', 2, NULL, NULL),
(24134066, 'MARCO ANTONIO', 'VELAZQUEZ', 'GAXIOLA', 'IS', '2', 2, NULL, NULL),
(24134236, 'ANGEL YAMIL', 'LEYVA', 'BANDA', 'IS', '1', 2, NULL, NULL),
(24134252, 'MIGUEL MARIO', 'GARCIA', 'ESPINOZA', 'IS', '1', 2, NULL, NULL),
(24134422, 'JUAN CARLOS', 'QUIÑONEZ', 'ROJAS', 'IS', '3', 2, NULL, NULL),
(24134430, 'EMMANUEL', 'IBARRA', 'PEÑUELAS', 'IS', '3', 2, NULL, NULL),
(24134449, 'ADRIAN', 'BARRAZA', 'QUINTANA', 'IS', '2', 2, NULL, NULL),
(24134481, 'LIZETH', 'RAYGOZA', 'CUEVAS', 'IS', '3', 2, NULL, NULL),
(24134511, 'ALAN GIOVANNY', 'LUQUE', 'OROZCO', 'IS', '2', 2, NULL, NULL),
(24134570, 'JESUS ALAIN', 'OSUNA', 'RIVERA', 'IS', '3', 2, NULL, NULL),
(24134589, 'HERLY SAIDD', 'SALGUERO', 'BARRERAS', 'IS', '3', 2, NULL, NULL),
(24134627, 'DIEGO', 'RAMIREZ', 'VAZQUEZ', 'IS', '1', 2, NULL, NULL),
(24433217, 'ERICK FERNANDO', 'LUGO', 'LEYVA', 'IS', '1', 2, '24433217.jpeg', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Alumno_Materia`
--

CREATE TABLE `Alumno_Materia` (
  `id_alumno` int(11) NOT NULL,
  `id_materia` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Asistencia`
--

CREATE TABLE `Asistencia` (
  `id_asistencia` int(11) NOT NULL,
  `id_alumno` int(11) NOT NULL,
  `id_sesion` int(11) NOT NULL,
  `estado` enum('PRESENTE','RETARDO','AUSENTE') DEFAULT 'PRESENTE',
  `porcentaje_presencia` decimal(5,2) DEFAULT 0.00,
  `fecha_hora` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Logs_Bluetooth`
--

CREATE TABLE `Logs_Bluetooth` (
  `id_log` bigint(20) NOT NULL,
  `id_sesion` int(11) NOT NULL,
  `no_cuenta` int(11) NOT NULL,
  `intensidad_senal` int(11) DEFAULT NULL,
  `fecha_hora` datetime DEFAULT current_timestamp(),
  `fuente` enum('ESP32','APP') DEFAULT 'ESP32'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Materias`
--

CREATE TABLE `Materias` (
  `codigo_materia` varchar(20) NOT NULL,
  `nombre_materia` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `Materias`
--

INSERT INTO `Materias` (`codigo_materia`, `nombre_materia`) VALUES
('IS101', 'Ingeniería de Software'),
('PO101', 'Programacion Orientada a objetos'),
('RC301', 'Redes de Computadoras'),
('SD201', 'Sistemas Digitales'),
('SO102', 'Sitemas Operativos');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Profesores`
--

CREATE TABLE `Profesores` (
  `no_empleado` int(11) NOT NULL,
  `nombre_profesor` varchar(150) DEFAULT NULL,
  `num_celular` varchar(20) DEFAULT NULL,
  `correo` varchar(100) DEFAULT NULL,
  `nip` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `Profesores`
--

INSERT INTO `Profesores` (`no_empleado`, `nombre_profesor`, `num_celular`, `correo`) VALUES
(12345, 'Profesor de Sistemas', NULL, 'profe@uas.edu.mx'),
(15000, 'Karla Janeth Romero Ledezma', '6681000002', 'karla@uas.edu.mx'),
(17001, 'Jesus Francisco Figueroa', '6681000001', 'figueroa@uas.edu.mx'),
(17200, 'Manuel de Jesus Rodriguez', '6681000003', 'manuel@uas.edu.mx'),
(17298, 'Gibran Uriel Lopez Coronel', '6681000004', 'dimas@uas.edu.mx');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Profesor_Materia`
--

CREATE TABLE `Profesor_Materia` (
  `id_profesor` int(11) NOT NULL,
  `id_materia` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `Profesor_Materia`
--

INSERT INTO `Profesor_Materia` (`id_profesor`, `id_materia`) VALUES
(15000, 'SD201'),
(17001, 'PO101'),
(17200, 'RC301'),
(17298, 'SO102');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Sesiones_Clase`
--

CREATE TABLE `Sesiones_Clase` (
  `id_sesion` int(11) NOT NULL,
  `no_empleado` int(11) NOT NULL,
  `codigo_materia` varchar(20) NOT NULL,
  `estado` enum('ACTIVA','FINALIZADA','CANCELADA') DEFAULT 'ACTIVA',
  `fecha_inicio` datetime DEFAULT current_timestamp(),
  `fecha_fin` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `Alumnos`
--
ALTER TABLE `Alumnos`
  ADD PRIMARY KEY (`no_cuenta`);

--
-- Indices de la tabla `Alumno_Materia`
--
ALTER TABLE `Alumno_Materia`
  ADD PRIMARY KEY (`id_alumno`,`id_materia`),
  ADD KEY `idx_mate` (`id_materia`);

--
-- Indices de la tabla `Asistencia`
--
ALTER TABLE `Asistencia`
  ADD PRIMARY KEY (`id_asistencia`),
  ADD KEY `fk_asist_al` (`id_alumno`),
  ADD KEY `fk_asist_sesion` (`id_sesion`);

--
-- Indices de la tabla `Logs_Bluetooth`
--
ALTER TABLE `Logs_Bluetooth`
  ADD PRIMARY KEY (`id_log`),
  ADD KEY `fk_logblue_ses` (`id_sesion`),
  ADD KEY `fk_logblue_al` (`no_cuenta`);

--
-- Indices de la tabla `Materias`
--
ALTER TABLE `Materias`
  ADD PRIMARY KEY (`codigo_materia`);

--
-- Indices de la tabla `Profesores`
--
ALTER TABLE `Profesores`
  ADD PRIMARY KEY (`no_empleado`);

--
-- Indices de la tabla `Profesor_Materia`
--
ALTER TABLE `Profesor_Materia`
  ADD PRIMARY KEY (`id_profesor`,`id_materia`),
  ADD KEY `idx_prof_mate` (`id_materia`);

--
-- Indices de la tabla `Sesiones_Clase`
--
ALTER TABLE `Sesiones_Clase`
  ADD PRIMARY KEY (`id_sesion`),
  ADD KEY `fk_sesclase_profe` (`no_empleado`),
  ADD KEY `fk_sesclase_mate` (`codigo_materia`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `Asistencia`
--
ALTER TABLE `Asistencia`
  MODIFY `id_asistencia` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `Logs_Bluetooth`
--
ALTER TABLE `Logs_Bluetooth`
  MODIFY `id_log` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `Sesiones_Clase`
--
ALTER TABLE `Sesiones_Clase`
  MODIFY `id_sesion` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `Alumno_Materia`
--
ALTER TABLE `Alumno_Materia`
  ADD CONSTRAINT `fk_al_mat_alumno` FOREIGN KEY (`id_alumno`) REFERENCES `Alumnos` (`no_cuenta`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_al_mat_materia` FOREIGN KEY (`id_materia`) REFERENCES `Materias` (`codigo_materia`) ON DELETE CASCADE;

--
-- Filtros para la tabla `Asistencia`
--
ALTER TABLE `Asistencia`
  ADD CONSTRAINT `fk_asist_al` FOREIGN KEY (`id_alumno`) REFERENCES `Alumnos` (`no_cuenta`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_asist_sesion` FOREIGN KEY (`id_sesion`) REFERENCES `Sesiones_Clase` (`id_sesion`) ON DELETE CASCADE;

--
-- Filtros para la tabla `Logs_Bluetooth`
--
ALTER TABLE `Logs_Bluetooth`
  ADD CONSTRAINT `fk_logblue_al` FOREIGN KEY (`no_cuenta`) REFERENCES `Alumnos` (`no_cuenta`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_logblue_ses` FOREIGN KEY (`id_sesion`) REFERENCES `Sesiones_Clase` (`id_sesion`) ON DELETE CASCADE;

--
-- Filtros para la tabla `Profesor_Materia`
--
ALTER TABLE `Profesor_Materia`
  ADD CONSTRAINT `fk_prof_mat_mate` FOREIGN KEY (`id_materia`) REFERENCES `Materias` (`codigo_materia`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_prof_mat_profe` FOREIGN KEY (`id_profesor`) REFERENCES `Profesores` (`no_empleado`) ON DELETE CASCADE;

--
-- Filtros para la tabla `Sesiones_Clase`
--
ALTER TABLE `Sesiones_Clase`
  ADD CONSTRAINT `fk_sesclase_mate` FOREIGN KEY (`codigo_materia`) REFERENCES `Materias` (`codigo_materia`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sesclase_profe` FOREIGN KEY (`no_empleado`) REFERENCES `Profesores` (`no_empleado`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
