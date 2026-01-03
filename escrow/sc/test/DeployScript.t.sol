// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../script/Deploy.s.sol";

contract DeployScriptTest is Test {
    function testDeployScript() public {
        // En un test, vm.startBroadcast() funcionará usando el default sender del test
        Deploy deploy = new Deploy();
        deploy.run();
    }
}
