//SPDX-License-identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

// IPFS에 NFT 정보를 저장하기 위해서 ERC721URIStorage 컨트랙트를 상속
contract NFT is ERC721URIStorage {
    // token IDs를 추적하기 위해서 Counters.Counter 사용
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // NFT들과 상호작용하기 위한 마켓플래이스 주소
    address contractAddress;

    // NFT 마켓에서 토큰 전송이나 소유권을 변경하는 기능 구현
    // setApprovalForAll 메소드 사용

    // token 이름을 KryptoBirdz, 심볼을 KBIRDZ로 설정
    // 부모 컨트랙트의 생성자 ERC721을 사용( NFT > ERC721URIStorage > ERC721 )
    constructor(address marketplaceAddress) ERC721("KryptoBirdz", "KBIRDZ") {
        contractAddress = marketplaceAddress;
    }

    // string은 바이트들의 배열이기 때문에 많은 양의 storage를 차지
    // 함수 호출 시 gas를 줄이기 위해서 string은 storage가 아니라 memory를 사용(default는 storage)
    function mintToken(string memory tokenURI) public returns (uint256) {
        // token을 민트하면 _tokenIds를 1만큼 증가시킨다.
        _tokenIds.increment();
        // 민트한 token에 부여할 id 값을 가져온다.
        uint256 newItemId = _tokenIds.current();
        // 부모 컨트랙트인 ERC721에 정의 되어있는 _mint(민트한 토큰을 보낼 주소(민트를 호출한 지갑 주소), token id) 함수 호출
        _mint(msg.sender, newItemId);
        // NFT의 고유한 속성(이름, 설명, 이미지 URI 등)은 json 파일 형태로 만든다.
        // 그리고 해당 파일을 호스팅해 얻은 URI를 해당 토큰 tokenURI에 저장한다.
        // _tokenURIs[tokenId] = _tokenURI;
        _setTokenURI(newItemId, tokenURI);
        // 마켓플래이스에게 민팅된 NFT 거래가 가능하도록 하는 권한을 부여
        setApprovalForAll(contractAddress, true);

        // 민트된 token id를 반환, 판매를 위한 설정
        return newItemId;
    }
}
