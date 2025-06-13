import { useState, useEffect } from "react";
import { ethers } from "ethers";

const Button = ({ children, ...props }) => (
  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg w-full sm:w-auto" {...props}>
    {children}
  </button>
);

const Input = (props) => (
  <input
    className="border border-gray-300 px-3 py-2 rounded-md w-full"
    {...props}
  />
);

const Toast = ({ message }) => (
  message ? (
    <div className="fixed top-4 right-4 bg-green-100 border border-green-300 text-green-800 px-4 py-2 rounded-xl shadow">
      {message}
    </div>
  ) : null
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
  const [toast, setToast] = useState("");

  const stakingAddress = "0x42bf653842AB6F40edcF353dA7F4DF7811023aa5";
  const maoAddress = "0x46148378a6Eb3D879F051398Cb2d4e428e991C3C";

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
    showToast("✅ Wallet connected");
  };

  const updateReward = async (addr) => {
    if (!provider || !addr) return;
    const staking = new ethers.Contract(stakingAddress, stakingAbi, provider);
    const data = await staking.stakes(addr);
    setReward(ethers.formatUnits(data.rewardDebt, 18));
  };

  const autoApproveAndStake = async () => {
    try {
      if (!stakeAmount || isNaN(stakeAmount) || Number(stakeAmount) <= 0) {
        return showToast("❌ Invalid stake amount");
      }
      const amt = ethers.parseUnits(stakeAmount, 18);
      const mao = new ethers.Contract(maoAddress, tokenAbi, signer);
      const staking = new ethers.Contract(stakingAddress, stakingAbi, signer);

      const balance = await mao.balanceOf(address);
      const allowance = await mao.allowance(address, stakingAddress);

      console.log(">>> Balance:", ethers.formatUnits(balance, 18));
      console.log(">>> Allowance:", ethers.formatUnits(allowance, 18));
      console.log(">>> Stake amount:", stakeAmount);

      if (balance.lt(amt)) return showToast("❌ Not enough MAO balance");

      if (allowance.lt(amt)) {
        showToast("🔐 Approving...");
        const tx = await mao.approve(stakingAddress, amt);
        await tx.wait();
        showToast("✅ Approve success");
      }

      showToast("⏳ Staking...");
      const stakeTx = await staking.stake(amt);
      await stakeTx.wait();
      showToast("✅ Stake successful");
      updateReward(address);
    } catch (err) {
      console.error("TX Error:", err);
      showToast("❌ Approve or stake failed");
    }
  };

  const withdraw = async () => {
    try {
      const staking = new ethers.Contract(stakingAddress, stakingAbi, signer);
      const amt = ethers.parseUnits(stakeAmount, 18);
      await staking.withdraw(amt);
      showToast("✅ Withdraw successful");
      updateReward(address);
    } catch {
      showToast("❌ Withdraw failed");
    }
  };

  const claim = async () => {
    try {
      const staking = new ethers.Contract(stakingAddress, stakingAbi, signer);
      await staking.claimReward();
      showToast("✅ Reward claimed");
      updateReward(address);
    } catch {
      showToast("❌ Claim failed");
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  };

  return (
    <div className="min-h-screen bg-yellow-100 text-black py-10 px-6 flex justify-center items-center">
      <Toast message={toast} />
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md space-y-4">
        <h1 className="text-3xl font-bold text-center">MAO Staking</h1>

        {!address ? (
          <Button onClick={connectWallet}>Connect Wallet</Button>
        ) : (
          <div className="space-y-3">
            <div className="text-sm break-words">Connected wallet: <strong>{address}</strong></div>
            <Input
              placeholder="Amount to stake or withdraw"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={autoApproveAndStake}>Auto Approve & Stake</Button>
              <Button onClick={withdraw}>Withdraw</Button>
              <Button onClick={claim}>Claim Reward</Button>
            </div>
            <div className="text-sm">Pending Reward: <strong>{reward}</strong> MAO</div>
          </div>
        )}
      </div>
    </div>
  );
}

