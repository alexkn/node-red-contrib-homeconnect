/// <reference types="@types/mocha" />
const helper = require('./TestHelper');
const homeConnectAuthNode = require('../nodes/home-connect-auth.js');

helper.init(require.resolve('node-red'));

describe('home-connect-auth Node', function () {

    afterEach(async function () {
        helper.unload();
    });

    it('should be loaded', async function () {
        var flow = [{ id: 'n1', type: 'home-connect-auth', name: 'test name' }];
        await helper.load(homeConnectAuthNode, flow);
        var n1 = helper.getNode('n1');

        n1.should.have.property('name', 'test name');
    });
});
