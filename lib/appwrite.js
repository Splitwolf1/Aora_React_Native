import { Account, Avatars, Client, Databases, ID, Query, Storage }  from "react-native-appwrite";


export const config = {
endpoint: "https://cloud.appwrite.io/v1",
platform: "com.brian.aora",
projectId:"6622345013d5947a4831",
databaseId: "662236617d89e7cd4fcc",
userCollectionId: "662236a2aa012341e4d0",
videoCollectionId: "66223739c6275c38f55c",
storageId: "6622672d1f329d09b6bb"
}
const {
endpoint,
platform,
projectId,
databaseId,
userCollectionId,
videoCollectionId,
storageId,
} = config;


// Init your react-native SDK
const client = new Client();

client
.setEndpoint(config.endpoint) //Your Appwrite Endpoint
.setProject(config.projectId) // Your project ID
.setPlatform(config.platform)

const account = new Account(client);
const avatars = new Avatars(client);
const databases = new Databases(client);
const storage = new Storage(client);

export const createUser = async (email, password, username) => {
    try {
        const newAccount = await account.create(
            ID.unique(),
            email,
            password,
            username,
        )
   if(!newAccount) throw Error;

   const avatarUrl = avatars.getInitials(username)

    await signIn(email, password);

    const newUser = await databases.createDocument(
        config.databaseId,
        config.userCollectionId,
        ID.unique(),
        {
            accountId: newAccount.$id,
            email,
            username,
            avatar: avatarUrl
        }
    )
    return newUser;

    } catch (error) {
        console.log(error);
        throw new Error(error);
    }

}
// Sign In
export const  signIn = async (email, password) => {
  try {
    const session = await account.createEmailSession(email, password);

    return session;
  } catch (error) {
    throw new Error(error);
  }
}

export const getCurrentUser = async () => {
    try {
        const currentAccount =await account.get();

        if (!currentAccount) throw Error;

  const currentUser = await databases.listDocuments(
    config.databaseId,
    config.userCollectionId,
    [Query.equal("accountId", currentAccount.$id)]
  )
  if(!currentUser) throw Error;

  return currentUser.documents[0];
} catch (error) {
    console.log(error);
}

}
export const getAllPosts = async () => {
  try {
    const posts = await databases.listDocuments(
      databaseId,
      videoCollectionId,
      [Query.orderDesc("$createdAt")]
    )
    return posts.documents;
  } catch (error) {
    throw new Error(error);
    
  }
}
export const getLatestPosts = async () => {
  try {
    const posts = await databases.listDocuments(
      databaseId,
      videoCollectionId,
      [Query.orderDesc("$createdAt", Query.limit(7))]
    )
    return posts.documents;
  } catch (error) {
    throw new Error(error);
    
  }
}

export const searchPosts = async (query) => {
  try {
    const posts = await databases.listDocuments(
      databaseId,
      videoCollectionId,
      [Query.search("title", query)]
    )
    return posts.documents;
  } catch (error) {
    throw new Error(error);
    
  }
}

export const getUserPosts = async (userId) => {
  try {
    const posts = await databases.listDocuments(
      databaseId,
      videoCollectionId,
      [Query.equal("creator", userId),  Query.orderDesc("$createdAt")]
    )
    return posts.documents;
  } catch (error) {
    throw new Error(error);
    
  }
}

export const signOut = async () => {
  try {
    const session = await account.deleteSession ("current");

    return session;
  } catch (error) {
    throw new Error(error);
  }
}
export const getFilePreview = async (fileId, type) => {
  let fileUrl;
  try {
    if(type === "video") {
      fileUrl = storage.getFileView(storageId, fileId)
    } else if (type === "image") {
      fileUrl = storage.getFilePreview(storageId, fileId, 2000, 2000, "top", 100)
    } else {
      throw new Error("Invalid file type")
    }

    if (!fileUrl) throw Error;

    return fileUrl;
  } catch (error) {
    throw new Error(error);
  }
}

 export const uploadFile = async (file, type) => {
  if(!file) return;

  const { mimeType, ...rest } = file;
  const asset = { 
    name: file.fileName,
    type: file.mimeType,
    size: file.fileSize,
    uri: file.uri,
  };

  try {
    const uploadedFile = await storage.createFile(
      storageId,
      ID.unique(),
      asset
    );

    const fileUrl = await getFilePreview(uploadedFile.$id, type);

    return fileUrl;
  } catch (error) {
    throw new Error(error);
  }
 }

export const createVideo = async (form) => {
  try {
    const [thumbnailUrl, videoUrl] = await Promise.all([
      uploadFile(form.thumbnail, "image"),
      uploadFile(form.video, "video"),
    ])

    const newPost = await databases.createDocument(
      databaseId, videoCollectionId, ID.unique(),{
       title: form.title,
       thumbnail: thumbnailUrl,
       video: form.prompt,
       creator: form.userId 
      }
    )
 return newPost;
  } catch (error) {
    throw new Error(error);
  }
}

