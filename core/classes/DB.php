<?php

class DB
{
    function connect()
    {
        $host = Config::$host;
        $database = Config::$database;
        $username = Config::$username;
        $password = Config::$password;

        return new PDO("mysql:host=$host; dbname=$database", $username, $password);
    }
}