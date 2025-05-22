import { Button } from "~/components/ui/button";
import { Icon } from "~/components/ui/icon";
import { Link } from "@tanstack/solid-router";



export default function Index() {

  return (
    <div class="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 class="text-3xl font-bold mb-6 text-center">Ana Maria's Discography</h1>
      <div class="flex justify-center items-center gap-4 mb-6">
        <Button>
          <Icon name="speaker" />
          <Link to="/tts">
            Text to Speech
          </Link>
        </Button>
     
      </div>
     
    </div>
  );
}
