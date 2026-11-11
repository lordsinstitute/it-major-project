pragma solidity >= 0.8.11 <= 0.8.11;
pragma experimental ABIEncoderV2;
//Drug solidity code
contract Drug {

    uint public userCount = 0; 
    mapping(uint => user) public userList; 
     struct user
     {
       string username;
       string password;
       string phone;
       string email;
       string home_address;
     }
     
   // events 
   event userCreated(uint indexed _userId);
   
   //function  to save user details to Blockchain
   function saveUser(string memory uname, string memory pass, string memory phone, string memory em, string memory ha) public {
      userList[userCount] = user(uname, pass, phone, em, ha);
      emit userCreated(userCount);
      userCount++;
    }

     //get user count
    function getUserCount()  public view returns (uint) {
          return  userCount;
    }

    uint public trialCount = 0; 
    mapping(uint => trial) public trialList; 
     struct trial
     {
       string user;
       string trial_discursion;
       string company;
       string upload_date;       
     }
 
   // events 
   event trialCreated(uint indexed _trialId);
   
   //function  to save trial details to Blockchain
   function saveTrial(string memory usr, string memory td, string memory cname, string memory udate) public {
      trialList[trialCount] = trial(usr, td, cname, udate);
      emit trialCreated(trialCount);
      trialCount++;
    }

   //get trial count
    function getTrialCount()  public view returns (uint) {
          return  trialCount;
    }

    function getUsername(uint i) public view returns (string memory) {
        user memory doc = userList[i];
	return doc.username;
    }

    function getPassword(uint i) public view returns (string memory) {
        user memory doc = userList[i];
	return doc.password;
    }

    function getPhone(uint i) public view returns (string memory) {
        user memory doc = userList[i];
	return doc.phone;
    }    

    function getEmail(uint i) public view returns (string memory) {
        user memory doc = userList[i];
	return doc.email;
    }      

    function getHomeAddress(uint i) public view returns (string memory) {
        user memory doc = userList[i];
	return doc.home_address;
    }

    function getUser(uint i) public view returns (string memory) {
        trial memory doc = trialList[i];
	return doc.user;
    }

    function getDiscursion(uint i) public view returns (string memory) {
        trial memory doc = trialList[i];
	return doc.trial_discursion;
    }

    function getCompany(uint i) public view returns (string memory) {
        trial memory doc = trialList[i];
	return doc.company;
    }

    function getDate(uint i) public view returns (string memory) {
        trial memory doc = trialList[i];
	return doc.upload_date;
    }   
       
}