import { ethers } from 'ethers';
import axios from 'axios';
import Web3Modal from 'web3modal';
import { nftaddress, nftmarketaddress } from '../config';
import NFT from '../artifacts/contracts/NFT.sol/NFT.json';
import KBMarket from '../artifacts/contracts/KBMarket.sol/KBMarket.json';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function Home() {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNFTs();
  }, []);

  const loadNFTs = async () => {
    try {
      setLoading(true);
      const provider = new ethers.providers.JsonRpcProvider();
      const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider);
      const marketContract = new ethers.Contract(nftmarketaddress, KBMarket.abi, provider);
      const marketTokens = await marketContract.fetchMarketTokens();

      const items = await Promise.all(
        marketTokens.map(async (marketToken) => {
          const tokenUri = await tokenContract.tokenURI(marketToken.tokenId);
          const meta = await axios.get(tokenUri);
          let price = ethers.utils.formatUnits(marketToken.price.toString(), 'ether');
          let item = {
            price,
            tokenId: marketToken.tokenId.toNumber(),
            seller: marketToken.seller,
            owner: marketToken.owner,
            image: meta.data.image,
            name: meta.data.name,
            description: meta.data.description,
          };

          return item;
        }),
      );
      setNfts(items);
      setLoading(false);
    } catch (e) {
      console.log(e);
      setLoading(false);
    }
  };

  const buyNFT = async (nft) => {
    try {
      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(nftmarketaddress, KBMarket.abi, signer);

      // console.log(nft.price.toString());
      // const price = ethers.utils.parseUnits(nft.price.toString(), 'ether')
      const price = ethers.utils.parseEther(nft.price.toString(), 'ether');
      // console.log(price);
      const transaction = await contract.createMarketSale(nftaddress, nft.tokenId, {
        value: price,
      });

      await transaction.wait();
      loadNFTs();
    } catch (e) {
      console.log(`Error buy nft: ${e.data.message}`);
    }
  };

  if (!loading && !nfts.length) return <h1>No NFTs in marketplace</h1>;

  return (
    <div className="flex justify-center">
      <div className="px-4" style={{ maxWidth: '1600px' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {nfts.map((nft, i) => (
            <div key={i} className="border shadow rounded-x1 overflow-hidden">
              <Image width="300" height="300" alt="" src={nft.image} />
              <div className="p-4">
                <p style={{ height: '64px' }} className="text-3x1 font-semibold">
                  {nft.name}
                </p>
                <div style={{ height: '72px', overflow: 'hidden' }}>
                  <p className="text-gray-400">{nft.description}</p>
                </div>
              </div>
              <div className="p-4 bg-black">
                <p className="text-3x-1 mb-4 font-bold text-white">{nft.price} ETH</p>
                <button
                  className="w-full bg-purple-500 text-white font-bold py-3 px-12 rounded"
                  onClick={() => buyNFT(nft)}
                >
                  Buy
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
