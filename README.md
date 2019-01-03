# node-red-contrib-homeconnect

![node-red-contrib-homeconnect](https://user-images.githubusercontent.com/17932877/50650925-1db3d280-0f82-11e9-9df9-9322751dee8e.jpg)

### Installation
To use the HomeConnect nodes a Client ID and Client Secret are required. Those can be received from the home connect developer page:

https://developer.home-connect.com/

* After setting up an account, register a new application and select **Authorization Code Grant Flow** as the OAuth Flow.
* Set the Redirect URI to `http://<ip-address>:<port>/oauth2/auth/callback`. Set the `ip-address` and `port` to match your Node-RED installation.

To install HomeConnect nodes for Node-RED, run the following command inside your Node-RED folder:

`npm install node-red-contrib-homeconnect`

### Available Nodes
- [OAuth2](#oauth2)
- [Request](#request)

## OAuth2
The OAuth2 node handles the authentication for the HomeConnect Developer API.

Once the node is set up and deployed, press the button to receive the required tokens. You will be forwared to the HomeConnect Developer Portal where you will be asked to sign in and provide the necessary access rights.

### Node Properties

| Property           | Information                                                           |
|:------------------:|:---------------------------------------------------------------------:|
| **Name**           | Name of the node *(optional)*                                         |
| **Client Id**      | Enter the Client ID available on the HomeConnect Developer Portal     |
| **Client Secret**  | Enter the Client Secret available on the HomeConnect Developer Portal |
| **Use Simulation** | Wheter or not simulation or real appliances shall be used             |

## Request
The Request node requires an OAuth2 node as an input to recevice an access token.

Additionally a second input triggers the request to the HomeConnect API.

### Node Properties

| Property       | Information                                                |
|:--------------:|:----------------------------------------------------------:|
| **Name**       | Name of the node *(optional)*                              |
| **Tag**        | Category you want to control                               |
| **Action**     | Action you want to perform                                 |
| **HAID**       | HAID of the home appliance                                 |
| **Option Key** | Option Key in case you want to control a specific option   |
| **Body**       | JSON data in case you want to set e.g. a program or option |
