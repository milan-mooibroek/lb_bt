# 🏦 Team Budget Manager

This is a simple  **CLI-based Demo Team Budget Management Tool** built with **Node.js**, **PostgreSQL**, and **Docker**.  

---
### 1️⃣ **Start the Docker Container**
This project is **Dockerized**, so setup is quick and simple. Run:

```bash
docker-compose up -d
```
This will **start all required services** in the background.

---

### 2️⃣ **Access the Running Container**
To enter the **Node.js container**, execute:

```bash
docker exec -it budget_node sh
```
This gives you an interactive shell inside the container.

---

### 3️⃣ **Initialize the Database**
Inside the Docker container, navigate to the app directory:

```bash
cd /app
```

Run the following to **set up the database**:

```bash
node manageDatabase.js delete create insert
```
- This will **drop existing tables** (if any), **recreate them**, and **insert demo data**.

**Note**: You can modify `manageDatabase.js` to adjust the **mock data**.

---

### 4️⃣ **Run the Budget Manager**
Once the database is set up, start the app:

```bash
npm i
node app
```
From here, you can **log in as a user**, **buy products**, and **manage budgets**.

---

## ⚡ **Database Structure**
The PostgreSQL database consists of **5 main tables**:

| Table        | Description |
|-------------|------------|
| `users`     | Stores user details (username, team, admin status) |
| `teams`     | Stores team names |
| `budgets`   | Tracks budget amounts, start & end dates |
| `products`  | List of available products with prices |
| `transactions` | Logs every product purchase |
and logs unused
---

## 📌 **Code Overview**
### **Key Files & Responsibilities**
- **`app.js`** → The main entry point to start the application.
- **`admin.js`** → Admin panel with management options.
- **`products.js`** → Manages product purchases.
- **`budgets.js`** → Handles budget queries & optimizations.
- **`users.js`** → Fetches & manages user data.
- **`manageDatabase.js`** → **Sets up the database & inserts demo data**.

### 🗃 **Code Comments**
- The code is **commented** for clarity.
- Each function is explained inside the respective file.

---


## 🛠 **How to Modify Demo Data**
The **default demo users, teams, and budgets** are located in `manageDatabase.js`.

To modify them:
1. Open `manageDatabase.js`
2. Adjust the **INSERT statements**
3. Run:
   ```bash
   node manageDatabase.js delete create insert
   ```
   This will **reset the database** with your new values.