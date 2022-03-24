//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract TokenVesting is Ownable {

    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    address vesting_owner;

    uint256 mentor_share = 7;
    uint256 advisor_share = 5;

    //Development stage
    uint256 private cliffDuration = 120 seconds;
    uint256 private duration = block.timestamp + 300 seconds;

    //Production stage
    // uint256 private cliffDuration = 60 days;
    // uint256 private duration = block.timestamp + 669 days;


    event TokensReleased(address token, uint256 amount);
    event TokenVestingRevoked(address token);

    uint256 private _cliff;
    uint256 private _start;
    uint256 private _duration;

    bool private _revocable;

    struct roles{
        address vesting_owner;
        address advisor;
        address mentor;
        address partner;
        uint256 price_amount_of_advisor;
        uint256 price_amount_of_mentor;
        uint256 price_amount_of_partner;
        bool mentorCanClaim;
        bool advisorCanClaim;
        bool mentorClaimed;
        bool advisorClaimed;
    }

    mapping (address => uint256) private _released;
    mapping (address => uint256) private _revoked;
    mapping (address => uint256) private _refunded;
    mapping (address => roles) public Roles;

    constructor (uint256 start, bool revocable, address _mentor, address _advisor, address _partner){
        vesting_owner = msg.sender;
        Roles[vesting_owner].vesting_owner = vesting_owner;
        require(cliffDuration <= duration, "TokenVesting: cliff is longer than duration");
        require(duration > 0, "TokenVesting: duration is 0");
        require(start.add(duration) > block.timestamp, "TokenVesting: final time is before current time");
        _revocable = revocable;
        _duration = duration;
        _cliff = start.add(cliffDuration);
        _start = start;
        Roles[vesting_owner].mentor = _mentor;
        Roles[vesting_owner].advisor = _advisor;
        Roles[vesting_owner].partner = _partner;
    }

    function mentorsAddress() public view returns (address) {
        return Roles[vesting_owner].mentor;
    }

    function advisorsAddress() public view returns (address) {
        return Roles[vesting_owner].advisor;
    }

    function partnersAddress() public view returns (address) {
        return Roles[vesting_owner].partner;
    }

    function cliff() public view returns (uint256) {
        return _cliff;
    }

    function started() public view returns (uint256) {
        return _start;
    }

    function durations() public view returns (uint256) {
        return _duration;
    }

    function revocables() public view returns (bool) {
        return _revocable;
    }

    function released(address token) public view returns (uint256) {
        return _released[token];
    }

    function revoked(address token) public view returns (bool) {
        return (_revoked[token] != 0);
    }

    function release(IERC20 token) public onlyOwner {
        uint256 unreleased = _releasableAmount(token);
        uint256 mentor_share_amount = unreleased * mentor_share / 100;
        uint256 advisor_share_amount = unreleased * advisor_share / 100;
        Roles[vesting_owner].price_amount_of_mentor = mentor_share_amount;
        Roles[vesting_owner].price_amount_of_advisor = advisor_share_amount;
        require(block.timestamp < _duration,"Vesting period is over !!!Owner cannot release the token");
        require(block.timestamp > _start,"Vesting period is not yet started !!!Owner cannot release the token");
        require(unreleased > 0, "TokenVesting: no tokens are due");
        _released[address(token)] = _released[address(token)].add(unreleased);
        emit TokensReleased(address(token), unreleased);
        Roles[vesting_owner].mentorCanClaim = true;
        Roles[vesting_owner].advisorCanClaim = true;
        Roles[vesting_owner].mentorClaimed = false;
        Roles[vesting_owner].advisorClaimed = false;
    }

    function revoke(IERC20 token) public onlyOwner {
        require(block.timestamp < _duration,"Vesting period is over !!!Owner cannot revoke the token");
        require(block.timestamp > _start,"Vesting period is not yet started !!!Owner cannot revoke the token");
        require(_revocable, "TokenVesting: cannot revoke");
        require(_revoked[address(token)] == 0, "TokenVesting: token already revoked");
        uint256 balance = token.balanceOf(address(this));
        _revoked[address(token)] = block.timestamp;
        uint256 unreleased = _releasableAmount(token);
        uint256 refund = balance.sub(unreleased);
        _refunded[address(token)] = refund;
        Roles[vesting_owner].mentorCanClaim = false;
        Roles[vesting_owner].advisorCanClaim = false;
        emit TokenVestingRevoked(address(token));
    }

    function vested(IERC20 token) public view returns (uint256) {
        require(block.timestamp < _duration,"the vesting time period is over");
        return _vestedAmount(token);
    }

    function _releasableAmount(IERC20 token) private view returns (uint256) {
        return _vestedAmount(token).sub(_released[address(token)]);
    }

    function _vestedAmount(IERC20 token) private view returns (uint256) {
        uint256 currentBalance = token.balanceOf(address(this));
        uint256 totalBalance = currentBalance.add(_released[address(token)]).add(_refunded[address(token)]);

        if (block.timestamp < _cliff) {
            return 0;
        } else if (block.timestamp >= _start.add(_duration) && _revoked[address(token)] == 0) {
            return totalBalance;
        } else if (_revoked[address(token)] > 0) {
            return totalBalance.mul(_revoked[address(token)].sub(_start)).div(_duration);
        } else {
            return totalBalance.mul(block.timestamp.sub(_start)).div(_duration);
        }
    }

    function claim_mentor_vesting_amount(IERC20 token) public {
        require(Roles[vesting_owner].mentorClaimed == false, "Already Claimed !!!");
        require(Roles[vesting_owner].mentorCanClaim == true, "Mentor cannot claim their reward");
        require(Roles[vesting_owner].mentor == msg.sender, 'You are not mentor');
        Roles[vesting_owner].mentorClaimed = true;
        token.safeTransfer(Roles[vesting_owner].mentor, Roles[vesting_owner].price_amount_of_mentor);
    }

    function claim_advisor_vesting_amount(IERC20 token) public {
        require(Roles[vesting_owner].advisorClaimed == false, "Already Claimed !!!");
        require(Roles[vesting_owner].advisorCanClaim == true, "Advisor cannot claim their reward");
        require(Roles[vesting_owner].advisor == msg.sender, 'You are not advisor');
        Roles[vesting_owner].advisorClaimed = true;
        token.safeTransfer(Roles[vesting_owner].advisor, Roles[vesting_owner].price_amount_of_advisor);
    }

    function getClaimStatusForMentor() public view returns(bool){
        require(Roles[vesting_owner].mentor == msg.sender, 'You are not mentor');
        return Roles[vesting_owner].mentorCanClaim;
    }

    function getClaimStatusForAdvisor() public view returns(bool){
        require(Roles[vesting_owner].advisor == msg.sender, 'You are not advisor');
        return Roles[vesting_owner].advisorCanClaim;
    }

    function getContractBalance(IERC20 token) public view returns(uint256){
        return token.balanceOf(address(this));
    }

    function getTimeStamp() public view returns(uint256){
        return block.timestamp;
    }
}