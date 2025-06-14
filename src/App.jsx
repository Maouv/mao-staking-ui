import { useState, useEffect } from "react";
import { ethers } from "ethers";
const Button = ({ children, ...props }) => (
  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg" {...props}>
    {children}
  </button>
);

const Input = (props) => (
  <input
    className="border border-gray-300 px-3 py-2 rounded-md w-full"
    {...props}
  />
);

const stakingAbi = [
  "function stakeNative() external payable",
  "function withdrawNative(uint256 amount) external",
  "function claimReward() external",
  "function stakes(address) view returns (uint256 amount, uint256 rewardDebt, uint256 lastUpdated)"
];

export default function MAOStakingUI() {
  const [address, setAddress] = useState("");
  const [provider, setProvider] = useState();
  const [signer, setSigner] = useState();
  const [stakeAmount, setStakeAmount] = useState("");
  const [reward, setReward] = useState("0");
  const [status, setStatus] = useState("");

  const stakingAddress = "0xbF20CC14264F15ce43d077c533992b5226FeB807";

const connectWallet = async () => {
  if (!window.ethereum) return alert("Please install MetaMask");
  const prov = new ethers.BrowserProvider(window.ethereum);
  await prov.send("eth_requestAccounts", []);
  const signer = await prov.getSigner();
  const addr = await signer.getAddress();
  setProvider(prov);
  setSigner(signer);
  setAddress(addr);
  updateReward(addr);
};

  const updateReward = async () => {
    const staking = new ethers.Contract(stakingAddress, stakingAbi, provider);
    const data = await staking.stakes(address);
    setReward(ethers.formatUnits(data.rewardDebt, 18));
  };

  const stake = async () => {
    try {
      const staking = new ethers.Contract(stakingAddress, stakingAbi, signer);
      const amt = ethers.parseUnits(stakeAmount, 18);
      setStatus("Staking MON...");
      const tx = await staking.stakeNative({ value: amt });
      await tx.wait();
      setStatus("✅ Staked!");
      updateReward();
    } catch (err) {
      console.error(err);
      setStatus("❌ Stake failed");
    }
  };

  const withdraw = async () => {
    try {
      const staking = new ethers.Contract(stakingAddress, stakingAbi, signer);
      const amt = ethers.parseUnits(stakeAmount, 18);
      await staking.withdrawNative(amt);
      setStatus("✅ Withdraw success");
      updateReward();
    } catch (err) {
      setStatus("❌ Withdraw failed");
    }
  };

  const claim = async () => {
    try {
      const staking = new ethers.Contract(stakingAddress, stakingAbi, signer);
      await staking.claimReward();
      setStatus("✅ Reward claimed");
      updateReward();
    } catch (err) {
      setStatus("❌ Claim failed");
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">
      <h1 className="text-xl font-bold">MAO Staking Dashboard</h1>
      <p className="text-sm">Connected wallet: {address}</p>
      <Input
        placeholder="Amount MON to stake or withdraw"
        value={stakeAmount}
        onChange={(e) => setStakeAmount(e.target.value)}
      />
      <div className="flex gap-2 flex-wrap">
        <Button onClick={stake}>Stake MON</Button>
        <Button onClick={withdraw}>Withdraw</Button>
        <Button onClick={claim}>Claim MAO</Button>
      </div>
      <div className="text-sm text-muted-foreground">Pending Reward: {reward} MAO</div>
      <div className="text-sm text-blue-500">{status}</div>
    </div>
  );
}
