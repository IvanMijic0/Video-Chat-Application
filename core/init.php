<?php

use MyApp\User;

session_start();

require "classes/DB.php";
require "classes/User.php";

$userObj = new User;

const BASE_URL = "http://localhost/Video-Chat-Application/";