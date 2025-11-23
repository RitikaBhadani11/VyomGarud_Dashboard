# 🚀 VYOM GARUD - MAVLink Drone Control System

<div align="center">

![VYOM GARUD](https://img.shields.io/badge/VYOM-GARUD-orange?style=for-the-badge&logo=drone)
![React](https://img.shields.io/badge/React-18.2-blue?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-18-green?style=for-the-badge&logo=nodedotjs)
![Python](https://img.shields.io/badge/Python-3.11-yellow?style=for-the-badge&logo=python)

**Advanced UAV Ground Control Station with Real-time Telemetry Dashboard**

[![Watch Demo](https://img.shields.io/badge/🎬_Watch_Full_Demo_Video-Click_Here-red?style=for-the-badge&logo=youtube)](https://drive.google.com/file/d/17yCtK6kz8jr4fUcJSKoXIA07QPvIKxcL/view?usp=sharing)

</div>

## 📖 Introduction

**VYOM GARUD** is a sophisticated Ground Control Station (GCS) designed for monitoring and controlling Unmanned Aerial Vehicles (UAVs) using the MAVLink communication protocol. This system provides real-time telemetry data visualization, flight monitoring, and drone management through a modern, responsive web interface.

### 🎯 Project Overview
VYOM GARUD simulates a complete drone ecosystem with:
- Real-time MAVLink telemetry data generation
- Beautiful, animated dashboard for data visualization
- WebSocket-based real-time communication
- Cloud deployment capabilities

## 🏗️ System Architecture

```mermaid
graph TD
    P[🤖 Python Simulator] -->|📨 UDP 14550<br/>MAVLink Protocol| N[🍃 Node.js Backend]
    N -->|⚡ WebSocket 3001<br/>Real-time Data| R[🌈 React Frontend]
    G[📚 GitHub] -->|🚀 Auto Deploy| RD[☁️ Render.com]
    RD --> LB[🔗 Live Backend]
    RD --> LF[🌐 Live Frontend]
    
    style P fill:#3776AB,color:white
    style N fill:#339933,color:white
    style R fill:#61DAFB,color:black
