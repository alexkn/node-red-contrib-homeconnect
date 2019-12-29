# node-red-contrib-homeconnect
This nodes for Node-RED allow to control devices which are connected to the [Home Connect](https://www.home-connect.com) system.

### Installation
To use the HomeConnect nodes a Client ID and Client Secret are required. Those can be received from the home connect developer page:

https://developer.home-connect.com/

* After setting up an account, register a new application and select **Authorization Code Grant Flow** as the OAuth Flow.
* Set the Redirect URI to `http://<ip-address>:<port>/homeconnect/auth/callback`. Set the `ip-address` and `port` to match your Node-RED installation.

### Available Nodes
- [home-connect-auth](#home-connect-auth)
- [home-connect-request](#home-connect-request)
- [home-connect-event](#home-connect-event)

## home-connect-auth
The node handles the authentication for the HomeConnect Developer API.

Start the authorization from the properties dialog, finish the authorization at Home Connect and then save and deploy your changes.

### Node Properties

| Property           | Information                                                           |
|:------------------:|:---------------------------------------------------------------------:|
| **Name**           | Name of the node *(optional)*                                         |
| **Client Id**      | Enter the Client ID available on the HomeConnect Developer Portal     |
| **Client Secret**  | Enter the Client Secret available on the HomeConnect Developer Portal |
| **Use Simulation** | Wheter or not simulation or real appliances shall be used             |

## home-connect-request
The Request node requires an home-connect-auth node as an config node to recevice an access token.

An input triggers the request to the HomeConnect API.

### Node Properties

| Property       | Information                                                |
|:--------------:|:----------------------------------------------------------:|
| **Name**       | Name of the node *(optional)*                              |
| **Tag**        | Category you want to control                               |
| **Action**     | Action you want to perform                                 |
| **HAID**       | HAID of the home appliance                                 |
| **Option Key** | Option Key in case you want to control a specific option   |
| **Body**       | JSON data in case you want to set e.g. a program or option |

## home-connect-event
The Request node requires an home-connect-auth node as an config node to recevice an access token.

It outputs event messages for the selected home appliance.

### Node Properties

| Property       | Information                                                |
|:--------------:|:----------------------------------------------------------:|
| **Name**       | Name of the node *(optional)*                              |
| **HAID**       | HAID of the home appliance                                 |
