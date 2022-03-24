const TokenVesting = artifacts.require("TokenVesting");
const MyToken = artifacts.require('MyToken');


contract('TokenVesting', function (accounts) {

    let instance = null
    before(async () => {
        instance1 = await MyToken.new('aaa', 'sss', 1000000000000000);
        instance2 = await TokenVesting.new(1648037520, true, accounts[2], accounts[3], accounts[4]);
    })
    const sleep = ms => new Promise(res => setTimeout(res, ms));
    var myTokenInstance;
    var vestingInstance;

    it('MyToken creation on deployment', async function () {
        myTokenInstance = instance1;
        vestingInstance = instance2;
        await myTokenInstance.transfer(vestingInstance.address, 10000000000, { from: accounts[0] });
        const getContractBalanceForMyToken = await myTokenInstance.balanceOf(accounts[0]);
        const getContractBalanceForVesting = await myTokenInstance.balanceOf(vestingInstance.address);

        assert.equal(getContractBalanceForMyToken, 999990000000000, 'MyToken', 'Contract balance of mytoken should be ')
        assert.equal(getContractBalanceForVesting, 10000000000, 'Contract balance of vesting should be 1 billion token')
    });

    it('Releasing the vesting token to mentor,advisor & partners', async function () {
        myTokenInstance = instance1;
        vestingInstance = instance2;
        const getCliffPeriod = await vestingInstance.cliff();
        const getDurationPeriod = await vestingInstance.durations();
        const getStartPeriod = await vestingInstance.started();
        const vestedAmount = await vestingInstance.vested(myTokenInstance.address);
        await vestingInstance.release(myTokenInstance.address, { from: accounts[0] });
        const releasedAmount = await vestingInstance.released(myTokenInstance.address);
        const getBalanceForMentor = await myTokenInstance.balanceOf(accounts[2]);
        const getBalanceForAdvisor = await myTokenInstance.balanceOf(accounts[3]);
        const getMentorAddress = await vestingInstance.mentorsAddress();
        const getAdvisorAddress = await vestingInstance.advisorsAddress();
        const getPartnerAddress = await vestingInstance.partnersAddress();

        assert.equal(getMentorAddress, accounts[2], 'Balance of mentor should be 0')
        assert.equal(getAdvisorAddress, accounts[3], 'Balance of mentor should be 0')
        assert.equal(getPartnerAddress, accounts[4], 'Balance of mentor should be 0')
        assert.equal(getBalanceForMentor, 0, 'Balance of mentor should be 0')
        assert.equal(getBalanceForAdvisor, 0, 'Balance of advisor should be 0')
    });

    it('Mentor claim the vesting token amount', async function () {

        myTokenInstance = instance1;
        vestingInstance = instance2;
        await sleep(7000);
        const releasedAmount = await vestingInstance.released(myTokenInstance.address);
        const getClaimStatusForMentorBeforeClaiming = await vestingInstance.getClaimStatusForMentor({from: accounts[2]});
        await vestingInstance.claim_mentor_vesting_amount(myTokenInstance.address, { from: accounts[2] });
        const getClaimStatusForMentorAfterClaiming = await vestingInstance.getClaimStatusForMentor({from: accounts[2]});
        const getBalanceForMentor = await myTokenInstance.balanceOf(accounts[2]);
        const getBalanceForAdvisor = await myTokenInstance.balanceOf(accounts[3]);

        assert.equal(getClaimStatusForMentorBeforeClaiming,true,'Claim status of mentor should be true')
        assert.equal(getClaimStatusForMentorAfterClaiming,true,'Claim status of mentor should be true')
    });

    it('Advisor claim the vesting token amount', async function () {

        myTokenInstance = instance1;
        vestingInstance = instance2;
        await sleep(7000);
        const getClaimStatusForAdvisorBeforeClaiming = await vestingInstance.getClaimStatusForAdvisor({from: accounts[3]});
        await vestingInstance.claim_advisor_vesting_amount(myTokenInstance.address, { from: accounts[3] });
        const getClaimStatusForAdvisorAfterClaiming = await vestingInstance.getClaimStatusForAdvisor({from: accounts[3]});
        const getBalanceForMentor = await myTokenInstance.balanceOf(accounts[2]);
        const getBalanceForAdvisor = await myTokenInstance.balanceOf(accounts[3]);

        assert.equal(getClaimStatusForAdvisorBeforeClaiming,true,'Claim status of advisor should be true')
        assert.equal(getClaimStatusForAdvisorAfterClaiming,true,'Claim status of advisor should be true')
    });

    it('Admin Revoking the vesting amount', async function () {

        myTokenInstance = instance1;
        vestingInstance = instance2;
        await sleep(7000);
        const getRevocableStatus = await vestingInstance.revocables();
        const getAdminRevokedStatusBeforeRevoking = await vestingInstance.revoked(myTokenInstance.address);
        await vestingInstance.revoke(myTokenInstance.address, { from: accounts[0] });
        const getAdminRevokedStatusAfterRevoking = await vestingInstance.revoked(myTokenInstance.address);
        const getBalanceForAdmin = await myTokenInstance.balanceOf(accounts[0]);
        const getBalanceForMyToken = await myTokenInstance.balanceOf(vestingInstance.address);

        assert.equal(getRevocableStatus,true,'Revocable should be true for the admin')
        assert.equal(getAdminRevokedStatusBeforeRevoking,false,'Revoked should be false')
        assert.equal(getAdminRevokedStatusAfterRevoking,true,'Revoked should be true')
    });

    it('If mentor claim the vesting amount from non-mentor account,we will get an error', async () => {


        await vestingInstance.release(myTokenInstance.address, { from: accounts[0] });
        await vestingInstance.claim_mentor_vesting_amount(myTokenInstance.address, { from: accounts[2] });
        
        try {
            await vestingInstance.claim_mentor_vesting_amount(myTokenInstance.address, { from: accounts[3] });
        } catch (error) {
            console.log("Error handled")
            assert.equal(error.reason)
        }
    });

    it('If advisor claim the vesting amount from non-advisor account,we will get an error', async () => {


        await vestingInstance.claim_advisor_vesting_amount(myTokenInstance.address, { from: accounts[3] });
        
        try {
            await vestingInstance.claim_advisor_vesting_amount(myTokenInstance.address, { from: accounts[3] });
        } catch (error) {
            console.log("Error handled")
            assert.equal(error.reason)
        }
    });

    it('If mentor get the status of claiming the vesting amount from non-mentor account,we will get an error', async () => {


        await vestingInstance.getClaimStatusForMentor({ from: accounts[2] });
        
        try {
            await vestingInstance.getClaimStatusForMentor({ from: accounts[2] });
        } catch (error) {
            console.log("Error handled")
            assert.equal(error.reason, "You are not advisor")
        }
    });

    it('If advisor get the status claiming the vesting amount from non-advisor account,we will get an error', async () => {


        await vestingInstance.getClaimStatusForAdvisor({ from: accounts[3] });
        
        try {
            await vestingInstance.getClaimStatusForAdvisor({ from: accounts[3] });
        } catch (error) {
            console.log("Error handled")
            assert.equal(error.reason, "You are not advisor")
        }
    });

    it('If admin revoke the vesting time again and again,we will get an error', async () => {


        const getAdminRevokedStatusBeforeRevoking = await vestingInstance.revoked(myTokenInstance.address,{from:accounts[0]});
        
        try {
            const getAdminRevokedStatusBeforeRevoking = await vestingInstance.revoked(myTokenInstance.address,{from:accounts[0]});
        } catch (error) {
            console.log("Error handled")
            assert.equal(error.reason)
        }
    });

    it('If mentor claim the vesting amount again,we will get an error', async () => {


        await vestingInstance.release(myTokenInstance.address, { from: accounts[0] });
        await vestingInstance.claim_mentor_vesting_amount(myTokenInstance.address, { from: accounts[2] });
        
        try {
            await vestingInstance.claim_mentor_vesting_amount(myTokenInstance.address, { from: accounts[2] });
        } catch (error) {
            console.log("Error handled")
            assert.equal(error.reason)
        }
    });

    it('If advisor claim the vesting amount again,we will get an error', async () => {


        await vestingInstance.claim_advisor_vesting_amount(myTokenInstance.address, { from: accounts[3] });
        
        try {
            await vestingInstance.claim_advisor_vesting_amount(myTokenInstance.address, { from: accounts[3] });
        } catch (error) {
            console.log("Error handled")
            assert.equal(error.reason)
        }
    });
});