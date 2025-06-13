import { ethers } from "ethers";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const stakingAbi = [
  "function stake(uint256 amount) external",
  "function withdraw(uint256 amount) external",
  "function claimReward() external",
  "function stakes(address) view returns (uint256 amount, uint256 rewardDebt, uint256 lastUpdated)"
];

const tokenAbi = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address) view returns (uint256)"
];

export default function MAOStakingUI() {
  const [address, setAddress] = useState("");
  const [provider, setProvider] = useState();
  const [signer, setSigner] = useState();
  const [stakeAmount, setStakeAmount] = useState("");
  const [reward, setReward] = useState("0");

  const stakingAddress = "0xYourStakingContractAddress";
  const maoAddress = "0xYourMAOTokenAddress";

  useEffect(() => {
    if (window.ethereum) {
      const prov = new ethers.BrowserProvider(window.ethereum);
      prov.getSigner().then(setSigner);
      setProvider(prov);
      prov.send("eth_requestAccounts", []).then((accounts) => setAddress(accounts[0]));
    }
  }, []);

  const updateReward = async () => {
    const staking = new ethers.Contract(stakingAddress, stakingAbi, provider);
    const data = await staking.stakes(address);
    setReward(ethers.formatUnits(data.rewardDebt, 18));
  };

  const stake = async () => {
    const mao = new ethers.Contract(maoAddress, tokenAbi, signer);
    const staking = new ethers.Contract(stakingAddress, stakingAbi, signer);
    const amt = ethers.parseUnits(stakeAmount, 18);
    await mao.approve(stakingAddress, amt);
    await staking.stake(amt);
    updateReward();
  };

  const withdraw = async () => {
    const staking = new ethers.Contract(stakingAddress, stakingAbi, signer);
    const amt = ethers.parseUnits(stakeAmount, 18);
    await staking.withdraw(amt);
    updateReward();
  };

  const claim = async () => {
    const staking = new ethers.Contract(stakingAddress, stakingAbi, signer);
    await staking.claimReward();
    updateReward();
  };

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">
      <h1 className="text-xl font-bold">MAO Staking Dashboard</h1>
      <p className="text-sm">Connected wallet: {address}</p>
      <Input
        placeholder="Amount to stake or withdraw"
        value={stakeAmount}
        onChange={(e) => setStakeAmount(e.target.value)}
      />
      <div className="flex gap-2">
        <Button onClick={stake}>Stake</Button>
        <Button onClick={withdraw}>Withdraw</Button>
        <Button onClick={claim}>Claim Reward</Button>
      </div>
      <div className="text-sm text-muted-foreground">Pending Reward: {reward} MAO</div>
    </div>
  );
}
