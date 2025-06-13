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
  "function stake(uint256 amount) external",
  "function withdraw(uint256 amount) external",
  "function claimReward() external",
  "function stakes(address) view returns (uint256 amount, uint256 rewardDebt, uint256 lastUpdated)"
];

const tokenAbi = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

export default function MAOStakingUI() {
  const [address, setAddress] = useState("");
  const [provider, setProvider] = useState();
  const [signer, setSigner] = useState();
  const [stakeAmount, setStakeAmount] = useState("");
  const [reward, setReward] = useState("0");
  const [status, setStatus] = useState("");

  const stakingAddress = ":0x42bf653842AB6F40edcF353dA7F4DF7811023aa5";
  const maoAddress = "0x46148378a6Eb3D879F051398Cb2d4e428e991C3C";

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
    await staking.stake(amt);
    updateReward();
  };

  const autoApproveAndStake = async () => {
    try {
      setStatus("Approving...");
      const mao = new ethers.Contract(maoAddress, tokenAbi, signer);
      const staking = new ethers.Contract(stakingAddress, stakingAbi, signer);
      const amt = ethers.parseUnits(stakeAmount, 18);
      await mao.approve(stakingAddress, amt);
      setStatus("Staking...");
      await staking.stake(amt);
      setStatus("✅ Staked!");
      updateReward();
    } catch (err) {
      console.error(err);
      setStatus("❌ Error during approve or stake");
    }
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
    <div className="min-h-screen bg-amber-50 text-black p-6 flex flex-col items-center">
      <div className="bg-white p-6 rounded-2xl shadow-md w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold">MAO Staking Dashboard</h1>
        <p className="text-sm">Connected wallet: {address}</p>
        <Input
          placeholder="Amount to stake or withdraw"
          value={stakeAmount}
          onChange={(e) => setStakeAmount(e.target.value)}
        />
        <div className="flex gap-2 flex-wrap">
          <Button onClick={autoApproveAndStake}>Auto Approve & Stake</Button>
          <Button onClick={withdraw}>Withdraw</Button>
          <Button onClick={claim}>Claim Reward</Button>
        </div>
        <div className="text-sm">Pending Reward: <strong>{reward}</strong> MAO</div>
        <div className="text-sm text-blue-700 font-medium">{status}</div>
      </div>
    </div>
  );
}
