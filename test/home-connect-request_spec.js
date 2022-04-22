/// <reference types="@types/mocha" />
const helper = require('./TestHelper');
const homeConnectRequestNode = require('../nodes/home-connect-request.js');

helper.init(require.resolve('node-red'));

describe('home-connect-request Node', function () {

    afterEach(async function () {
        helper.unload();
    });

    it('should be loaded', async function () {
        var flow = [{ id: 'n1', type: 'home-connect-request', name: 'test name' }];
        await helper.load(homeConnectRequestNode, flow);
        var n1 = helper.getNode('n1');

        n1.should.have.property('name', 'test name');
    });
});
