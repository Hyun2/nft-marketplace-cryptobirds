import { ethers } from 'ethers';
import axios from 'axios';
import { nftaddress, nftmarketaddress } from '../config';
import NFT from '../artifacts/contracts/NFT.sol/NFT.json';
import KBMarket from '../artifacts/contracts/KBMarket.sol/KBMarket.json';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Web3Modal from 'web3modal';

export default function MyAssets() {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNFTs();
  }, []);

  const loadNFTs = async () => {
    try {
      setLoading(true);

      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();

      const tokenContract = new ethers.Contract(nftaddress, NFT.abi, signer);
      const marketContract = new ethers.Contract(nftmarketaddress, KBMarket.abi, signer);
      const data = await marketContract.fetchMyNFTs();

      const items = await Promise.all(
        data.map(async (myToken) => {
          const tokenUri = await tokenContract.tokenURI(myToken.tokenId);
          const meta = await axios.get(tokenUri);
          let price = ethers.utils.formatUnits(myToken.price.toString(), 'ether');
          let item = {
            price,
            tokenId: myToken.tokenId.toNumber(),
            seller: myToken.seller,
            owner: myToken.owner,
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
      console.dir(e);
      setLoading(false);
    }
  };

  if (!loading && !nfts.length) return <h1>You do not own any NFs currently :(</h1>;

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
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
