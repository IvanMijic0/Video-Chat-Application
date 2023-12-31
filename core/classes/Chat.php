<?php

namespace MyApp;

use Exception;
use http\Client;
use Ratchet\ConnectionInterface;
use Ratchet\MessageComponentInterface;
use SplObjectStorage;

class Chat implements MessageComponentInterface
{
    protected SplObjectStorage $clients;
    public User $userObj;
    public $data;

    public function __construct()
    {
        $this->clients = new SplObjectStorage();
        $this->userObj = new User;
    }

    public function onOpen(ConnectionInterface $conn)
    {
        // Store the new connection to send messages to later
        $queryString = $conn->httpRequest->getUri()->getQuery();
        parse_str($queryString, $query);

        if($data = $this->userObj->getUserBySession($query['token'])){
            $this->data  = $data;
            $conn->data  = $data;
            $this->clients->attach($conn);
            $this->userObj->updateConnection($conn->resourceId, $data->userId);

            echo "New connection! ({$data->username})\n";
        }
    }

    public function onClose(ConnectionInterface $conn)
    {
        // The connection is closed, remove it, as we can no longer send it messages
        $this->clients->detach($conn);

        echo "Connection $conn->resourceId has disconnected\n";
    }

    public function onError(ConnectionInterface $conn, Exception $e)
    {
        echo "An error has occurred: {$e->getMessage()}\n";

        $conn->close();
    }

    public function onMessage(ConnectionInterface $from, $msg)
    {
        $numRecV = count($this->clients) - 1;

        echo sprintf(
            'Connection %s sending message "%s" to %d other connection%s' . "\n",
            $from->resourceId,
            $msg,
            $numRecV,
            $numRecV === 1 ? '' : 's'
        );

        $data   = json_decode($msg, true);
        $sendTo = $this->userObj->userData($data["sendTo"]);

        $send["sendTo"]        = $sendTo->userId;
        $send["by"]            = $from->data->userId;
        $send["profileImage"]  = $from->data->profileImage;
        $send["username"]      = $from->data->username;
        $send["type"]          = $data["type"];
        $send["data"]          = $data["data"];

        foreach ($this->clients as $client) {
            if ($from !== $client) {
                // The sender is not the receiver, send to each client connected
                if ($client->resourceId == $sendTo->connectionId || $from == $client) {
                    $client->send(json_encode($send));
                }
            }
        }
    }
}
