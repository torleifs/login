import { useEffect, useState } from 'react';

import { Button } from './components/button';

import RegistrationModalContent from './features/registration/RegistrationModal';

import { Dialog, DialogTrigger } from './components/dialog';
import { useToast } from '@/components/hooks/use-toast';
import { GlobalNotification } from './types';
import { Toaster } from './components/toaster';
import { ToastAction } from '@radix-ui/react-toast';
import { assertPlayer } from './features/registration/registration';

function App() {
  const [isModalActive, setIsModalActive] = useState(false);
  const { toast } = useToast();
  const [notification, setNotification] = useState<GlobalNotification | undefined>(undefined);
  useEffect(() => {
    if (notification !== undefined) {
      toast({
        variant: 'destructive',
        title: notification?.heading,
        description: notification?.message,
        action: <ToastAction altText="Ok">Ok</ToastAction>,
      });
    }
  }, [notification, toast]);

  return (
    <div className="bg-background text-foreground flex justify-center  items-center h-screen">
      <section className="mx-auto flex flex-col items-center gap-2 py-8 md:py-12 md:pb-8 lg:py-24 lg:pb-20">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">Passwordless login</h1>
        <small className="text-sm text-gray-500">Authentication from the future</small>
        <p className="text-sm md:text-base lg:text-lg text-center m-2 max-w-md ">
          Register a user and log in with a single tap. No passwords, I promise.
        </p>
        <div className="flex justify-around w-full p-2">
          <Dialog open={isModalActive} onOpenChange={setIsModalActive}>
            <DialogTrigger asChild>
              <Button variant="secondary" onClick={() => setIsModalActive(true)}>
                Register
              </Button>
            </DialogTrigger>
            <RegistrationModalContent
              setGlobalNotification={setNotification}
              setIsModalActive={setIsModalActive}
            />
          </Dialog>
          <Button
            onClick={async () => {
              const player = await assertPlayer();
              if (player !== undefined) {
                setNotification({
                  heading: 'User was logged in',
                  message: `${player.name} was logged in`,
                });
              }
            }}
          >
            Log in
          </Button>
        </div>
      </section>
      <Toaster />
    </div>
  );
}

export default App;
