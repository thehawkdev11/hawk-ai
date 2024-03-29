import { checkApiLimit, incrementApiLimit } from "@/lib/api-limit";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY,
});

export async function POST(req: any) {
  try {
    const { userId } = auth();
    const body = await req.json();
    console.log(body);
    const { prompt } = body;

    if (!userId) {
      return new NextResponse("unauthorized", { status: 401 });
    }

    if (!prompt) {
      new NextResponse("Messages are required", { status: 400 });
    }

    const freeTrial = await checkApiLimit();

    if (!freeTrial) {
      return new NextResponse(
        "Free trial has expired. Please upgrade to pro.",
        { status: 403 }
      );
    }

    const response = await replicate.run(
      "riffusion/riffusion:8cf61ea6c56afd61d8f5b9ffd14d7c216c0a93844ce2d82ac1c9ecc9c7f24e05",
      {
        input: {
          prompt_a: prompt,
        },
      }
    );

    await incrementApiLimit();

    return NextResponse.json(response);
  } catch (error) {
    console.log("MUSIC ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
