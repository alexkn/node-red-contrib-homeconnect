module.exports = function (RED) {
    const EventSource = require('eventsource');

    function HomeConnectEvent(config) {
        RED.nodes.createNode(this,config);

        this.auth = RED.nodes.getNode(config.auth);
        this.name = config.name;
        this.haid = config.haid;
        this.eventSource = null;

        this.status({ fill: 'red', shape: 'ring', text: 'not connected' });
        this.auth.register(this);

        const node = this;

        node.AccessTokenRefreshed = () => {
            node.closeEventSource();
            node.initEventSource();
        };

        node.initEventSource = () => {
            if(!node.haid) {
                return;
            }

            let url = node.auth.getHost() + '/api/homeappliances/' + node.haid + '/events';

            node.eventSource = new EventSource(url, {
                headers: {
                    'Authorization': 'Bearer ' + node.auth.getAccessToken(),
                    'Accept': 'text/event-stream'
                }
            });

            node.eventSource.addEventListener('open', node.onOpen);
            node.eventSource.addEventListener('error', node.onError);
            node.eventSource.addEventListener('STATUS', node.handleMessage);
            node.eventSource.addEventListener('EVENT', node.handleMessage);
            node.eventSource.addEventListener('NOTIFY', node.handleMessage);
            node.eventSource.addEventListener('DISCONNECTED', node.handleMessage);
            node.eventSource.addEventListener('CONNECTED', node.handleMessage);
        };

        node.onOpen = () => {
            node.status({ fill: 'green', shape: 'dot', text: 'ready' });
        };

        node.onError = (error) => {
            node.error(JSON.stringify(error));
            node.status({ fill: 'red', shape: 'ring', text: error.message });
        };

        node.handleMessage = (event) => {
            let data = undefined;
            if(event.data) {
                data = JSON.parse(event.data);
            }

            if(data && data.items) {
                data.items.forEach(item => {
                    node.send({
                        type: event.type,
                        payload: item,
                        id: event.lastEventId
                    });
                });
            }else{
                node.send({
                    type: event.type,
                    payload: data,
                    id: event.lastEventId
                });
            }
        };

        node.closeEventSource = () => {
            if(node.eventSource) {
                node.eventSource.removeEventListener('STATUS', node.handleMessage);
                node.eventSource.removeEventListener('EVENT', node.handleMessage);
                node.eventSource.removeEventListener('NOTIFY', node.handleMessage);
                node.eventSource.removeEventListener('DISCONNECTED', node.handleMessage);
                node.eventSource.removeEventListener('CONNECTED', node.handleMessage);
                node.eventSource.removeEventListener('open', node.onOpen);
                node.eventSource.removeEventListener('error', node.onError);
                node.eventSource.close();
                this.status({ fill: 'red', shape: 'ring', text: 'disconnected' });
            }
        };

        node.on('close', () => {
            node.closeEventSource();
            node.auth.unregister(this);
        });
    }

    RED.nodes.registerType('home-connect-event', HomeConnectEvent);
};
