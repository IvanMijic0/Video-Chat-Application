<?php

namespace MyApp;
use Config;
use PDO;

require "config.php";

class DB
{
    function connect(): PDO
    {
        $host = Config::$host;
        $database = Config::$database;
        $username = Config::$username;
        $password = Config::$password;

        return new PDO("mysql:host=$host; dbname=$database", $username, $password);
    }
}