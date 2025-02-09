import React, { useEffect, useState } from "react";
import api from "../../api";



function Users(){
    const [users, setUsers]= useState([])

console.log("Users", users)
    useEffect(()=>{
        const fetchUsers = async () => {
            const data = await api.getUsers();
            if (data) setUsers(data);
          };
          fetchUsers();
    }, [])
return(<div> <ul>{
    users.map((user)=>{
    return(<li>{user.name}</li>)
})}
    </ul>  </div>)
}

export default Users 