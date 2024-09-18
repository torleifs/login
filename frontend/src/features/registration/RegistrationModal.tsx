import { useForm, SubmitHandler } from 'react-hook-form';

import { yupResolver } from '@hookform/resolvers/yup';
import { playerSchema } from './PlayerValidation';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/dialog';
import { Button } from '@/components/button';
import { Label } from '@/components/label';
import { Input } from '@/components/input';
import { Player } from './types';
import { registerNewPlayer } from './registration';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { GlobalNotification } from '@/types';
import { handleAxiosError } from '@/utils';

type RegistrationModalContentProps = {
  setIsModalActive: React.Dispatch<React.SetStateAction<boolean>>;
  setGlobalNotification: React.Dispatch<React.SetStateAction<GlobalNotification | undefined>>;
};

const RegistrationModalContent = ({
  setIsModalActive,
  setGlobalNotification,
}: RegistrationModalContentProps) => {
  const onSubmit: SubmitHandler<Player> = async (player: Player) => {
    let returnedPlayer: Player | undefined = undefined;
    try {
      setIsLoading(true);
      returnedPlayer = await registerNewPlayer(player);
    } catch (err) {
      if (err instanceof TypeError) {
        setGlobalNotification({
          heading: 'Missing information',
          message:
            'Most likely, id, origin or password is missing in the challenge from the server',
        });
      } else if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setGlobalNotification({
          heading: 'Operation not allowed',
          message:
            'Either a permissions policy blocks the operation or a there is a cross-origin issue',
        });
      } else {
        handleAxiosError('Failed to register player', err, setGlobalNotification);
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setIsModalActive(false);
      }, 500);
    }
    if (returnedPlayer !== undefined) {
      setGlobalNotification({
        heading: 'Player registered',
        message: `${returnedPlayer.name} was registered`,
      });
    }
  };

  const {
    register,
    handleSubmit,
    formState: { isValid },
  } = useForm<Player>({ resolver: yupResolver(playerSchema), mode: 'all' });
  const [isLoading, setIsLoading] = useState(false);
  return (
    <DialogContent className="sm:max-w-[425px] bg-black text-white">
      <DialogHeader>
        <DialogTitle>Register a new user</DialogTitle>
        <DialogDescription>We only need a name and an email address.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <form id="registrationForm" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-4 items-center gap-4 mb-8">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              defaultValue="Ash Williams"
              className="col-span-3"
              {...register('name', { required: true })}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              email
            </Label>
            <Input
              id="email"
              defaultValue="ash@groovy.com"
              className="col-span-3"
              {...register('email')}
            />
          </div>
        </form>
      </div>
      <DialogFooter>
        <Button type="submit" form="registrationForm" disabled={!isValid || isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Registering player' : 'Register player'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default RegistrationModalContent;
