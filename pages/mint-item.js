import { useRouter } from 'next/router';
import { useState } from 'react';
import { create as ipfsHttpClient } from 'ipfs-http-client';
import Web3Modal from 'web3modal';
import { ethers } from 'ethers';
import { nftaddress, nftmarketaddress } from '../config';
import NFT from '../artifacts/contracts/NFT.sol/NFT.json';
import KBMarket from '../artifacts/contracts/KBMarket.sol/KBMarket.json';
import Image from 'next/image';

const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0');

const MintItem = () => {
  const [fileUrl, setFileUrl] = useState(null);
  const [formInput, setFormInput] = useState({
    price: '',
    name: '',
    discription: '',
  });
  const router = useRouter();

  const handleUploadFile = async (e) => {
    const file = e.target.files[0];

    try {
      const added = await client.add(file, {
        progress: (prog) => console.log(`received: ${prog}`),
      });
      const url = `https://ipfs.infura.io/ipfs/${added.path}`;
      console.log(`image url: ${url}`);

      setFileUrl(url);
    } catch (e) {
      console.log(`Error Uploading File: ${e}`);
    }
  };

  const uploadMetadataForNFTandCallCreateMarketItem = async () => {
    const { name, description, price } = formInput;
    if (!name || !description || !price || !fileUrl) return;

    try {
      const data = JSON.stringify({ name, description, price, image: fileUrl });

      const added = await client.add(data);
      const url = `https://ipfs.infura.io/ipfs/${added.path}`;

      createMarketItem(url);
    } catch (e) {
      console.log(`Error uploading metadata: ${e}`);
    }
  };

  const createMarketItem = async (url) => {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    let nftContract = new ethers.Contract(nftaddress, NFT.abi, signer);
    console.log(nftaddress, NFT.abi);
    console.log(url);
    let transaction = await nftContract.mintToken(url);
    let tx = await transaction.wait();
    console.log(tx.events);
    const event = tx.events.find((event) => event.event === 'Transfer');
    let value = event.args[2];
    let tokenId = value.toNumber();

    const price = ethers.utils.parseUnits(formInput.price, 'ether');

    let marketContract = new ethers.Contract(nftmarketaddress, KBMarket.abi, signer);
    let listingPrice = await marketContract.getListingPrice();
    listingPrice = listingPrice.toString();

    transaction = await marketContract.makeMarketItem(nftaddress, tokenId, price, { value: listingPrice });
    await transaction.wait();
    router.push('./');
  };

  return (
    <div className="flex justify-center">
      <div className="w-1/2 flex flex-col pb-12">
        <input
          placeholder="Asset Name"
          className="mt-8 border rounded p-4"
          onChange={(e) => setFormInput({ ...formInput, name: e.target.value })}
        />
        <textarea
          placeholder="Asset Description"
          className="mt-2 border rounded p-4"
          onChange={(e) => setFormInput({ ...formInput, description: e.target.value })}
        />
        <input
          placeholder="Asset Price in Eth"
          className="mt-2 border rounded p-4"
          onChange={(e) => setFormInput({ ...formInput, price: e.target.value })}
        />
        <input type="file" name="Asset" className="mt-4" onChange={handleUploadFile} />{' '}
        {fileUrl && <Image width="300" height="300" alt="" className="rounded mt-4" src={fileUrl} />}
        <button
          onClick={uploadMetadataForNFTandCallCreateMarketItem}
          className="font-bold mt-4 bg-purple-500 text-white rounded p-4 shadow-lg"
        >
          Mint NFT
        </button>
      </div>
    </div>
  );
};

export default MintItem;
