const fs = require('fs');
/**
 * On Simulator the refresh_token changes at every request, so we have to update
 * At the physical endpoint it remains the same, but I'm not sure if it stays that way.
 * The access token should also be saved so that a refresh is not started with every deploy.
 * 
 * Currently it's not possible to update node credentials at runtime
 * https://discourse.nodered.org/t/change-node-credentials-at-runtime/19590/2
 * 
 * So we have to save the tokens...  
 */
module.exports = function (RED) {
    let tokenfile = RED.settings.userDir + '/homeconnect_tokens.json';

    let loadTokenFile = () => {
        try {
            if (fs.existsSync(tokenfile)) {
                let content = fs.readFileSync(tokenfile, 'utf8');
                let tokens = JSON.parse(content);

                return tokens;
            }
        } catch (err) {
            console.error(err);
        }

        return {};
    };

    return {
        saveTokens: (nodeId, tokens) => {
            let alltokens = loadTokenFile();
            alltokens[nodeId] = tokens;
            fs.writeFileSync(tokenfile, JSON.stringify(alltokens,null,1));
        },
        getTokens: (nodeId) => {
            let alltokens = loadTokenFile();
            if(alltokens[nodeId]) {
                return alltokens[nodeId];
            }
            return {};
        }
    };
};
