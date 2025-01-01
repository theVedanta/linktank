import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "../../../lib/dbConnect";
import Event from "../../../models/Event";
import { NextResponse } from "next/server";

export async function GET(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect();
    try {
        const events = await Event.find().sort({ date_from: -1 });
        return NextResponse.json({ success: true, events: events }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 400 });
    }
}