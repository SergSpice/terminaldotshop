import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import vscode from "@/lib/vscode-bridge"
import { useEffect, useState } from "react"

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

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data;
      if (msg.type === 'success') {
        setState('success');
      }

      if (msg.type === 'error') {
        setState('error');
      }
    }
    window.addEventListener('message', handleMessage);

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <>
      {state === 'error' && (
        <div className="text-red-500 text-center">
          An error occurred while creating the address.
        </div>
      )}
      {state === 'success' && (
        <div className="text-green-500 text-center">
          Address created successfully!
        </div>
      )}
      {!state && <AddressForm onSubmit={(values) => {
        vscode.postMessage({
          command: 'submitAddress',
          payload: values,
        });
      }} />}
    </>
  );
}

interface AddressFormProps {
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
              <FormLabel>Province</FormLabel>
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
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
