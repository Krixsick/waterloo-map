import express from "express";
import * as cheerio from "cheerio";

interface WaterlooEvent {
  name: string;
  date: string;
  time: string;
  location: string;
  cost?: string;
  food?: string;
  detailURL?: string;
  mapURL?: string;
  coordinates: string;
}

const scrap_info = async () => {
  try {
    pass;
  } catch (error) {
    console.log(error);
  }
};
