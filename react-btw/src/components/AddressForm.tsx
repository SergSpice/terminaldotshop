import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import vscode from "@/lib/vscode-bridge";
import { useEffect, useState } from "react";
import { CircleCheckBig, CircleX, Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  street1: z.string().min(5, "Street address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  province: z.string().min(2, "Province must be at least 2 characters").optional(),
  country: z.string(),
  zip: z.string().min(5, "Zip code must be at least 5 characters"),
  phone: z.string().optional(),
});

export interface AddressCreateParams {
  city: string;
  country: string;
  name: string;
  street1: string;
  zip: string;
  phone?: string;
  province?: string;
  street2?: string;
}

export function Address() {
  const [state, setState] = useState<'success' | 'error' | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data;
      if (msg.type === 'success') {
        setLoading(false);
        setState('success');
      }

      if (msg.type === 'error') {
        setLoading(false);
        setState('error');
      }
    }
    window.addEventListener('message', handleMessage);

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <>
      {state === 'error' && (
        <div className="space-y-4 text-center pt-8">
          <h2 className="text-xl font-bold text-red-500 gap-2 flex items-center justify-center">
            <CircleX className="text-red-500" />
            Error Adding Address
          </h2>
          <p>
            There was an error adding your address. Please check your input and try again.
          </p>
          <Button
            variant={'destructive'}
            onClick={() => {
              vscode.postMessage({
                command: 'close',
              });
            }}
          >
            Close Tab
          </Button>
        </div>
      )}
      {state === 'success' && (
        <div className="space-y-4 text-center pt-8">
          <h2 className="text-xl font-bold text-green-500 gap-2 flex items-center justify-center">
            <CircleCheckBig className="text-green-500" />
            Address Saved Successfully!
          </h2>
          <p>
            Your address has been added successfully. You can now use it for your orders.
          </p>
          <Button
            variant={'destructive'}
            onClick={() => {
              vscode.postMessage({
                command: 'close',
              });
            }}
          >
            Close Tab
          </Button>
        </div>
      )}
      {!state && <AddressForm
        loading={loading}
        onSubmit={
          (values) => {
            setLoading(true);
            vscode.postMessage({ command: 'submitAddress', payload: values })
          }
        }
      />}
    </>
  );
}

interface AddressFormProps {
  loading: boolean;
  onSubmit: (values: z.infer<typeof formSchema>) => void;
}

export function AddressForm(props: AddressFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      street1: "",
      city: "",
      province: "",
      country: "",
      zip: "",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    props.onSubmit(values);
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-center py-4">
        Shipping Address
      </h1>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 w-2/3 mx-auto"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="street1"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Street Address</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your street address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your city" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="province"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Province / State</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your province" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="EU">European Union</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="zip"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Zip Code</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your zip code" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            disabled={props.loading}
            type="submit"
          >
            {props.loading && <Loader2 className="animate-spin" />}
            Save
          </Button>
        </form>
      </Form>
    </>
  )
}
