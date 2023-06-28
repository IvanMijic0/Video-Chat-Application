<?php

namespace MyApp;
use PDO;

class User
{
    public $userId;
    public string $sessionId;
    public PDO $db;

    public function __construct()
    {
        $db = new DB;
        $this->db = $db->connect();
        $this->userId = $this->ID();
        $this->sessionId = $this->getSessionId();
    }

    public function ID()
    {
        if ($this->isLoggedIn()) {
            return $_SESSION["userId"];
        }
        return error_log("User is not logged in!");
    }

    public function getSessionId(): string
    {
        return session_id();
    }

    public function emailExist($email)
    {
        $query = "SELECT * 
                   FROM users 
                   WHERE email = :email";
        $stm = $this->db->prepare($query);
        $stm->execute(["email" => $email]);

        $user = $stm->fetch(PDO::FETCH_OBJ);

        if (!empty($user)) {
            return $user;
        } else {
            return false;
        }
    }

    public function hash($password)
    {
        return password_hash($password, PASSWORD_DEFAULT);
    }

    public function redirect($location)
    {
        header("Location: " . BASE_URL . $location);
    }

    public function userData($userData = "")
    {
        $userId = (!empty($userId) ? $userId : $this->userId);

        $query = "SELECT *
                  FROM users
                  WHERE userId = :userId";
        $stm = $this->db->prepare($query);
        $stm->execute(["userId" => $userId]);

        return $stm->fetch(PDO::FETCH_OBJ);
    }

    public function isLoggedIn(): bool
    {
        return isset($_SESSION["userId"]);
    }

    public function logout()
    {
        $_SESSION = array();
        session_destroy();
        session_regenerate_id();
        $this->redirect("index.php");
    }

    public function getUsers()
    {
        $query = "SELECT *
                  FROM users
                  WHERE userId != :userId";
        $stm = $this->db->prepare($query);
        $stm->execute(["userId" => $this->userId]);

        $users = $stm->fetchAll(PDO::FETCH_OBJ);

        foreach ($users as $user) {
            echo '<li class="select-none transition hover:bg-green-50 p-4 cursor-pointer select-none">
	              <a href="' . BASE_URL . $user->username . '">
		          <div class="user-box flex items-center flex-wrap">
		          <div class="flex-shrink-0 user-img w-14 h-14 rounded-full border overflow-hidden">
		             <img class="w-full h-full" src="' . BASE_URL . $user->profileImage . '">
		            </div>
		      <div class="user-name ml-2">
		          <div><span class="flex font-medium">' . $user->name . '</span></div>
	        	    <div></div>
	        	</div>
	    	    </div>
	             </a>
             </li>';
        }
    }

    public function getUserByUsername($username)
    {
        $query = "SELECT *
                  FROM users
                  WHERE username = :username";
        $stm = $this->db->prepare($query);
        $stm->execute(["username" => $username]);

        return $stm->fetch(PDO::FETCH_OBJ);
    }

    public function updateSession()
    {
        $query = "UPDATE users 
                  SET sessionId = :sessionId 
                  WHERE userId = :userId";
        $stm = $this->db->prepare($query);
        $stm->execute([
            "sessionId" => $this->sessionId,
            "userId" => $this->userId
        ]);
    }

    public function getUserBySession($sessionId)
    {
        $query = "SELECT *
                  FROM users
                  WHERE sessionId = :sessionId";
        $stm = $this->db->prepare($query);
        $stm->execute(["sessionId" => $sessionId]);

        return $stm->fetch(PDO::FETCH_OBJ);
    }

    public function updateConnection($connectionId, $userId)
    {
        $query = "UPDATE users 
                  SET connectionId = :connectionId 
                  WHERE userId = :userId";
        $stm = $this->db->prepare($query);
        $stm->execute([
            "connectionId" => $connectionId,
            "userId" => $userId
        ]);
    }
}